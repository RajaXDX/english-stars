"""Prepares Apple's side before a TestFlight upload, using the App Store Connect API key:
  1. registers the app's bundle ID if it is not registered yet
  2. works out the Team ID (so nobody has to copy it by hand)
  3. checks that the app exists in App Store Connect
Reads ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH, BUNDLE_ID from the environment."""
import json, os, sys, time, urllib.request, urllib.error, urllib.parse
import jwt

key_id, issuer, bundle = os.environ["ASC_KEY_ID"], os.environ["ASC_ISSUER_ID"], os.environ["BUNDLE_ID"]
token = jwt.encode({"iss": issuer, "iat": int(time.time()), "exp": int(time.time()) + 900, "aud": "appstoreconnect-v1"},
                   open(os.environ["ASC_KEY_PATH"]).read(), algorithm="ES256", headers={"kid": key_id})

def api(method, path, body=None):
    req = urllib.request.Request("https://api.appstoreconnect.apple.com" + path, method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        print(f"::error::Apple answered {e.code} for {method} {path.split('?')[0]}: {e.read().decode()[:600]}")
        sys.exit(1)

found = [b for b in api("GET", "/v1/bundleIds?limit=200&filter[identifier]=" + urllib.parse.quote(bundle))["data"]
         if b["attributes"]["identifier"] == bundle]
if found:
    print("Bundle ID already registered:", bundle)
    bid = found[0]
else:
    bid = api("POST", "/v1/bundleIds", {"data": {"type": "bundleIds",
              "attributes": {"identifier": bundle, "name": "English Stars", "platform": "IOS"}}})["data"]
    print("Registered bundle ID:", bundle)

team = bid["attributes"]["seedId"]
with open(os.environ["GITHUB_ENV"], "a") as f:
    f.write(f"APPLE_TEAM_ID={team}\n")
print("Team ID found.")

apps = api("GET", "/v1/apps?filter[bundleId]=" + urllib.parse.quote(bundle))["data"]
if not any(a["attributes"]["bundleId"] == bundle for a in apps):
    print(f"::error::The app does not exist in App Store Connect yet. Create it: My Apps → + → New App → iOS, bundle ID {bundle}. Then run this again.")
    sys.exit(1)
print("App record found:", apps[0]["attributes"]["name"])
