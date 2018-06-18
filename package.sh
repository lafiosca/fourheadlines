#!/bin/bash

# "set -e" makes it so if any step fails, the script aborts:
set -e

# Change to the directory of the script
cd "${BASH_SOURCE%/*}"

# Include config variables
source ./config.sh

# Build Lambda package
cd src/tweeter
npm install
cd ../..

# Clean up any previous run
rm -f sam-output.yml

# Package SAM template (loads Lambda dist zips to S3 locations)
aws cloudformation package --template-file sam-template.json --output-template-file sam-output.yml --s3-bucket "$S3BucketArtifacts" --s3-prefix "$S3PrefixArtifacts"

# Deploy CloudFormation stack
aws cloudformation deploy --template-file sam-output.yml --stack-name "$StackName"

