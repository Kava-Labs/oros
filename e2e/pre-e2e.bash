#!/bin/bash

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