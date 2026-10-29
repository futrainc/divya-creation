#!/usr/bin/env bash
# Assembles the public site into ./_site (used by Cloudflare Pages: build command "bash build.sh", output "_site").
set -euo pipefail
rm -rf _site && mkdir _site
cp -r index.html robots.txt sitemap.xml _headers css js img data _site/
touch _site/.nojekyll
echo "Built $(find _site -type f | wc -l) files, $(du -sh _site | cut -f1)"
