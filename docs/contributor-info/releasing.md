# Install and Release

Manual steps:

1. Update /lib/react_on_rails_pro/version.rb with new VERSION
1. Update /package.json 
1. Commit
1. git tag -a "0.9.1" # replace version
1. git push origin "0.9.1" # replace version

## Testing the Gem before Release from a Rails App
See [Contributing](../../CONTRIBUTING.md)


## Notes for releasing on Github Gems and Packages
1. Keep `release-it` updated by running `yarn global add release-it` 
1. `./package.json` specifies the registry as Github:
    ```json
      "publishConfig": {
        "registry": "https://npm.pkg.github.com/@shakacode-tools"
      },
    ```
    and configures release-it:
    ```json
    "release-it": {
      "github": {
        "release": true
      },
      "npm": {
        "publish": false
      }
    },
    ```
