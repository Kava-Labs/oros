#!/bin/bash

WHALE_MNEMONIC=$1
EVM_WHALE_MNEMONIC=$2
SCRIPT_CONTEXT=$3

# account generation & funding is done with this script in dev only for convenience
# in CI the GH Actions workflow will do those steps instead so that the results from the process are written to stdout
# this script is ran through node child_process by playwright and only stderr is being logged to the terminal
if [ "$SCRIPT_CONTEXT" == "dev" ]; then
  if [ ! -d e2e-account-provider ]; then
    git clone https://github.com/Kava-Labs/e2e-account-provider
  fi
  cd e2e-account-provider && make build && cd ..
#      Comment out to run locally if accounts.json is manually added
  rm -f accounts.json
  ./e2e-account-provider/account-provider --mnemonic="$WHALE_MNEMONIC" --evm_mnemonic="$EVM_WHALE_MNEMONIC" --provider_config="./e2e/provider_config.json" || exit 1
fi

# GitHub repository and release information
metamask_repo_owner="MetaMask"
metamask_repo_name="metamask-extension"
metamask_release_name="metamask-chrome"
metamask_release_tag="12.9.3"

base_directory='./e2e'

# Directory to save the release
metamask_extension_path="$base_directory/$metamask_release_name-$metamask_release_tag"

# Check if release has already been downloaded if yes then exit
if [ ! -d "$metamask_extension_path" ]; then
  mkdir -p "$metamask_extension_path"
  # Download the release
  url="https://github.com/$metamask_repo_owner/$metamask_repo_name/releases/download/v$metamask_release_tag/$metamask_release_name-$metamask_release_tag.zip"

  echo "getting the metamask extension from $url"

  wget --quiet "$url" -P "$base_directory"

  # Extract the contents of the zip file
  unzip "$metamask_extension_path.zip" -d "$metamask_extension_path"

  rm "$base_directory/$metamask_release_name-$metamask_release_tag.zip"

else
  echo "metamask extension already exists."
fi
