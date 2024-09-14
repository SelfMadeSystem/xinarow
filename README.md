# XInARow

X In A Row is a game made by SelfMadeSystem (Shoghi Simon) in which a number of
players take turns placing their color in a grid and they try to get X amount in
a row (either orthogonally or diagonally).

## Features

Currently, the game supports:

- 1 to 8 teams
- 1 to 8 players per team
- any grid size
- any amount in a row
- cartesian grids
- hexagonal grids
- triangular grids
- usernames
- gravity
- expanding grids

## Building

This project uses the [pnpm](https://pnpm.io) package manager. You must install
it before building it: [pnpm install guide](https://pnpm.io/installation).

Use the command `pnpm dev` to preview it locally for development purposes,
`pnpm build` to build the project, and `pnpm preview` to host the project. You
may add the `--host` argument to either the `dev` or `preview` command to host
it on your local network (more than just localhost, i.e. 192.168.0.20 if your
local ip is that).

If you want to enable multiplayer mode, you must host the server and set the
`VITE_MULTIPLAYER` environment variable to `true`.

## Contributing

If you want to contribute, please open a pull request on the GitHub repository.
It will be reviewed and merged if it is good.

## Credits

- Shoghi Simon, SelfMadeSystem (me): Programming, design, and everything else
- [pnpm](https://pnpm.io): Package manager
- [Vite](https://vitejs.dev): Build tool

## Contact

If you have any issues, please open an issue on the GitHub repository. If you
want to contact me, my discord is `SelfMadeSystem#3808`.

## License

This project is licensed under the GNU Affero General Public License v3.0. The
terms and conditions essentially boil down to this (this is not legal advice):

- You may use it any way you like
- You may modify it under these conditions:
  - Your modified copy must have the same license
  - You must state the changes made
  - You must disclose the source code of your project

USE AT YOUR OWN RISK. I AM NOT RESPONSIBLE FOR ANYTHING THAT HAPPENS TO YOU OR
YOUR COMPUTER.
