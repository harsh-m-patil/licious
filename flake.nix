{
  description = "Licious monorepo dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            pnpm
            playwright-driver
          ];

          PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
          PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "1";
          PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            echo "Playwright configured via Nix (playwright-driver)."
            echo "Use: pnpm install && pnpm --filter web test"
          '';
        };
      }
    );
}
