#!/usr/bin/env python3
"""
Syncs supported regions data from Redis Cloud API to data/rc_supported_regions.json
"""

import json
import requests
import os

RC_API_BASE_URL = "https://api.redislabs.com/v1"
OUTPUT_FILE = "data/rc_supported_regions.json"
RC_API_KEY = os.getenv("RC_API_KEY")
RC_API_SECRET_KEY = os.getenv("RC_API_SECRET_KEY")


def fetch_regions():
    """
    Fetch all regions from both endpoints and merge the results.

    Returns:
        list: List of provider objects matching rc_supported_regions.json format
              e.g. [{"provider": "aws", "regions": {"us-east-1": {...}, ...}}, ...]
    """
    pro_response = requests.get(
        f"{RC_API_BASE_URL}/regions",
        headers={ "x-api-key": RC_API_KEY, "x-api-secret-key": RC_API_SECRET_KEY }
    )
    pro_response.raise_for_status()

    pro_data = pro_response.json()

    essentials_response = requests.get(
        f"{RC_API_BASE_URL}/fixed/plans",
        headers={ "x-api-key": RC_API_KEY, "x-api-secret-key": RC_API_SECRET_KEY }
    )
    essentials_response.raise_for_status()

    essentials_data = essentials_response.json()

    # Build intermediate dict for easier manipulation
    regions_by_provider = {}
    for region in pro_data.get("regions", []):
        provider = region.get("provider").lower()
        name = region.get("name")
        if provider and name:
            if provider not in regions_by_provider:
                regions_by_provider[provider] = {}
            regions_by_provider[provider][name] = {
                "location": "UNKNOWN",
                "area": "UNKNOWN",
                "pro": True,
                "essentials": False
            }

    for plan in essentials_data.get("plans", []):
        provider = plan.get("provider").lower()
        name = plan.get("region")
        if provider and name:
            if provider not in regions_by_provider:
                regions_by_provider[provider] = {}
            if name not in regions_by_provider[provider]:
                regions_by_provider[provider][name] = {
                    "location": "UNKNOWN",
                    "area": "UNKNOWN",
                    "pro": False,
                    "essentials": True
                }
            else:
                regions_by_provider[provider][name]["essentials"] = True

    # Sort regions within each provider
    for provider in regions_by_provider:
        regions_by_provider[provider] = dict(sorted(regions_by_provider[provider].items()))

    # Convert to list format matching rc_supported_regions.json
    result = []
    for provider in sorted(regions_by_provider.keys()):
        result.append({
            "provider": provider,
            "regions": regions_by_provider[provider]
        })

    return result


def get_provider_regions(data, provider):
    """Helper to get regions dict for a provider from the list format."""
    for item in data:
        if item.get("provider") == provider:
            return item.get("regions", {})
    return {}

def load_existing_regions():
    """Load the current rc_supported_regions.json file"""
    with open(OUTPUT_FILE, 'r') as f:
        return json.load(f)


def save_regions(data):
    """Save updated regions to rc_supported_regions.json"""
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def main():
    print("Syncing supported regions...")

    existing_data = load_existing_regions()
    changed = False

    new_data = fetch_regions()

    for new_provider_obj in new_data:
        provider = new_provider_obj["provider"]
        new_regions = new_provider_obj["regions"]
        existing_regions = get_provider_regions(existing_data, provider)

        for region_id, region_info in new_regions.items():
            if region_id not in existing_regions:
                changed = True
                existing_regions[region_id] = region_info
                print(f"  New region: {provider}/{region_id}")
            else:
                if existing_regions[region_id]["essentials"] != region_info["essentials"]:
                    changed = True
                    existing_regions[region_id]["essentials"] = region_info["essentials"]
                    print(f"  Updated essentials for: {provider}/{region_id}")
                if existing_regions[region_id]["pro"] != region_info["pro"]:
                    changed = True
                    existing_regions[region_id]["pro"] = region_info["pro"]
                    print(f"  Updated pro for: {provider}/{region_id}")

    if changed:
        save_regions(existing_data)
        print("Changes saved.")
    else:
        print("No changes detected.")

    print("Done.")


if __name__ == "__main__":
    main()
