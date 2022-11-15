[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://supportukrainenow.org/)

# ADIF to VIA file decorator

Simple tool to append QSL_VIA manager to ADIF with your QSO.
Database of QSL managers: https://www.okdxf.eu/index.php/databaze-qsl-manazeru

*disclaimer:* this is raw prototype-like project, without further ambitions for fine-tuning and code quality improvements

## Install Nodejs and NPM

[https://nodejs.org/en/download/](https://nodejs.org/en/download/)

## Install dependencies

- run `npm install`

## Example of usage

- download file from `https://www.okdxf.eu/index.php/databaze-qsl-manazeru`
- unzip and place file to folder with this application - default is `qslmgr.txt`
- export ADIF file with desired QSO from your LOG
- run `node /bin/adif2via.js -f your_path/your_adif_file.adi -m qslmgr.txt`
- check for output `your_path/finished_your_adif_file.adi` file with QSL_VIA based-on `qslmgr.txt` QSL managers information
- check for output `your_path/manager_your_adif_file.adi` file **with** QSL_VIA only QSO
- check for output `your_path/non-manager_your_adif_file.adi` file **without** QSL_VIA only QSO

## Devel

- tested with nodejs `16.*` on Windows 10
- update deps `npx npm-check-updates -u`

## TODO

- resolve logic for one callsign with multiple manager by different date (e.g. use od not use QSO date for match)
- add switch for QSL_SENT status
- clean-up messy code
