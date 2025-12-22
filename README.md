# Hotaudio Downloader

A Chrome extension for downloading from Hotaudio.net.

INFO: This project has moved to closed source for... obvious reasons. I hope this is understandable else it would be difficult to keep patching it.

## Screenshot
<div align="center">
<img src="https://raw.githubusercontent.com/medy17/hotaudio-downloader/refs/heads/main/readme-assets/hotaudio_downloader.png" />
</div>

## Overview

Hotaudio.net uses modern streaming technologies (like MPEG-DASH) where audio is delivered in small, encrypted chunks. This prevents simple "right-click and save" downloading. This extension works by intercepting the decrypted audio data just before it's played by your browser, automating a high-speed playback session to capture all the data, and then stitching it together into a single, downloadable `.m4a` file.


## Installation

Since this extension is not on the Chrome Web Store, it must be loaded manually in Developer Mode.

1.  **Download the Extension**: Click on the green code button, download az zip, unzip into a folder of the same name (e.g., `hotaudio-downloader`).
2.  **Open Chrome Extensions**: Open Google Chrome, navigate to the extensions page by typing `chrome://extensions` into the address bar and pressing Enter.
3.  **Enable Developer Mode**: In the top-right corner of the Extensions page, toggle the "Developer mode" switch to the ON position.
4.  **Load Unpacked**: You will now see three new buttons. Click on the **"Load unpacked"** button.
5.  **Select the Folder**: A file dialog will open. Navigate to and select the folder where you saved the extension files (e.g., `hotaudio-downloader`). Select the `dist` folder.
6.  **Done!**: The "Hotaudio Downloader" extension should now appear in your list of extensions and its icon will be added to your Chrome toolbar.


## Usage

1.  Navigate to a page on `hotaudio.net` that contains an audio player.
2.  Click the Hotaudio Downloader icon in your Chrome toolbar.
3.  Click the **"Download Audio"** button in the popup window.
4.  The process will begin. You can monitor the progress in the popup and on the extension icon itself.
5.  Once the capture is complete, a standard "Save As" dialog will appear, allowing you to save the `.m4a` audio file to your computer.

## P.S: I recommend pinning the extension to your toolbar when you're downloading to see progress for larger files. Unpin when you're done.
