# anim4u

Download Anime Movies and TV series in your terminal

## Overview

- [Installation](#installation)
  1. [Package Manager Installation](#installation)
  2. [Installation from Source](#installation)
- [Usage](#Usage)
  1. [download](#download)
  2. [clear](#clear)
- - [Providers](#providers)

## Installation

- Requirement
  - [NodeJs](https://nodejs.org)
  - [FFmpeg](https://ffmpeg.org/download.html)

It is highly recommended you have ffmpeg installed on your machine, as some providers will require it to convert TS files to MP4.

- Linux (Ubuntu/Debian):

```bash
sudo apt-get install ffmpeg

```

- Linux (Fedora/RHEL/CentOS):

```bash
sudo dnf install ffmpeg

```

- macOS (using Homebrew):
  First, install Homebrew if you haven't already:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

```

Then, install FFmpeg:

```bash
brew install ffmpeg
```

- Windows:

```bash
winget install --id=Gyan.FFmpeg  -e

```

Then install anim4u

```bash
  npm i -g anim4u
    or
  yarn global add anim4u
    or
  pnpm i -g anim4u
```

2. Install from source

```sh
    git clone https://github.com/iamstarcode/anim4u.git \
    && cd anim4u \

    && npm install \
    or
    && yarn install \
    or
    && pnpm i \

    && npm install -g .
```

## Usage

```bash
Usage: anim4u [options] [command]

Options:
  -d, --debug     show debugging errors
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  download        Download a TV series or Movie
  clear           Clear cache
  help [command]  display help for command
```

#### `download`

The download command is used to scrap and download anime

```bash
Usage:
 anim4u download [<provider:anime_name>] -f -r 720 -e 1-10
Options:
  -d, --debug             Debugging (default: false)
  -f, --force             Force refecth for download cache, links and searches (default: false)
  -q, --quality <number>  the prefered quality for videos
  -e, --episodes <items>  the episodes to download
  -h, --help              display help for command
```

```bash
anim4u download 'animepahe:one piece' -f -q 720 -e 1,7-10,100-105
```

    *   The download argument, <provider:search_query> is used to define a supported provider and
        the anime search keyword. `'animepahe:one piece'`
    *   Downloaded anime are placed in directory where the command is run.
    *   The download command is efficeint by default, stores caches of every result.
    *   `-f` flag is used to force new searches and ignore cache, example are when new episodes has arrived since last time the download command was run.
    *   `-q` flag is used to select a prefered video quality `360`,`480`,`720`,`1080`. When not provided a prompt will be displayed to select a preferred qulaity.
    *   `-e` flag takes multiple ranges of episodes to download.
          *   `100` will be only episode 100.
          *   `7-10` will be episode 7,8,9 and 10
          *   Any episode falling between multiple ranges will only download that episode once.
          *   `1-2,1-5,3-4` will only download episode 1,2,3,4 and 5, regardless how many times they occur withing multiple ranges.
    *   The project cannot modify the content type. That means, videos in the `ts` format need to be converted to other formats externally post download.
    *   With ffmpeg installed, it automatically converts videos to mp4.
    *   The downloading process cannot be controlled for `animepahe` provider.
    *   The downloading process can keep cache of previously uncompleted downloads and resume the next time.

#### `clear`

The clear command is used to delete search history and any other downloaded video caches

```bash
anim4u clear [provider|all]
```

## Provider

These are the currently supported providers, we plan to add more soon. Some providers may stop working unexpectedly, and we try our best to have it fixed, and some time might be due to providers server runtime being down.

| Website                                  | Searcher Prefix | Available Qualities     | Content Extension |
| ---------------------------------------- | --------------- | ----------------------- | ----------------- |
| [AnimePahe](https://www.animepahe.com/)  | `animepahe`     | 360p, 480p, 720p, 1080p | MP4               |
| [AnimePahe2](https://www.animepahe.com/) | `animepahe2`    | 360p, 480p, 720p, 1080p | MP4 / TS          |
| [GogoAnime](https://gogoanimehd.io/)     | `gogoanime`     | 360p, 480p, 720p, 1080p | MP4 / TS          |
