# Hotaudio Downloader

A Chrome extension for downloading from Hotaudio.net.

## Overview

Hotaudio.net uses modern streaming technologies (like MPEG-DASH) where audio is delivered in small, encrypted chunks. This prevents simple "right-click and save" downloading. This extension works by intercepting the decrypted audio data just before it's played by your browser, automating a high-speed playback session to capture all the data, and then stitching it together into a single, downloadable `.m4a` file.


## Installation

Since this extension is not on the Chrome Web Store, it must be loaded manually in Developer Mode.

1.  **Download the Files**: Place all the provided files (`manifest.json`, `popup.html`, `popup.css`, `popup.js`, etc.) into a single, dedicated folder on your computer (e.g., `hotaudio-downloader`).
2.  **Open Chrome Extensions**: Open Google Chrome, navigate to the extensions page by typing `chrome://extensions` into the address bar and pressing Enter.
3.  **Enable Developer Mode**: In the top-right corner of the Extensions page, toggle the "Developer mode" switch to the ON position.
4.  **Load Unpacked**: You will now see three new buttons. Click on the **"Load unpacked"** button.
5.  **Select the Folder**: A file dialog will open. Navigate to and select the folder where you saved the extension files (e.g., `hotaudio-downloader`). Do not select an individual file; select the entire folder.
6.  **Done!**: The "Hotaudio Downloader" extension should now appear in your list of extensions and its icon will be added to your Chrome toolbar.


## How It Works (Technical Breakdown)

The extension employs a multi-script strategy to reliably capture the audio:

1.  **Injection & Hijacking (`hijack.js`)**: As soon as the page starts loading, this script is injected into the main page's context (`MAIN` world). It does two critical things:
    -   It overrides the browser's native `SourceBuffer.prototype.appendBuffer` function. This allows it to intercept every raw, decrypted chunk of audio data that the website's player tries to buffer for playback.
    -   It intercepts the instantiation of the website's custom `AudioSource` object, storing a reference to it on the `window` object (`window.as`). This gives our automation script a direct handle to control the player.

2.  **User Initiation (`popup.js`)**: When you click the "Download Audio" button in the popup, the extension injects the main automation script.

3.  **Automation & Capture (`main_world.js`)**: This script is injected into the `MAIN` world and takes control:
    -   It finds the player instance that `hijack.js` exposed (`window.as`).
    -   It mutes the audio element, sets its `playbackRate` to the maximum (16x), and begins playing from the start.
    -   As the audio plays at high speed, the hijacked `appendBuffer` function from step 1 captures every audio chunk into a global array (`window.DECRYPTED_AUDIO_CHUNKS`).
    -   The script sends progress updates back to the popup and background script.

4.  **Stitching & Download**: Once the `ended` event fires on the audio element (or if playback stalls near the end), the script:
    -   Takes all the captured raw audio chunks.
    -   Combines them into a single `Blob` with the correct MIME type (`audio/mp4`).
    -   Generates a local URL for this Blob.
    -   Creates a temporary `<a>` link with the `download` attribute and programmatically clicks it to trigger the browser's save file dialog.

5.  **Communication Bridge (`content.js` & `background.js`)**:
    -   The scripts in the `MAIN` world (`main_world.js`) cannot directly talk to the extension's other parts. They use `window.postMessage` to send status updates.
    -   `content.js` acts as a bridge, listening for these messages and forwarding them to `background.js`.
    -   `background.js` manages the state for each tab (e.g., current progress, status message) and is responsible for updating the dynamic extension icon. The popup UI queries the background script to get the latest state.

## Usage

1.  Navigate to a page on `hotaudio.net` that contains an audio player.
2.  Click the Hotaudio Downloader icon in your Chrome toolbar.
3.  Click the **"Download Audio"** button in the popup window.
4.  The process will begin. You can monitor the progress in the popup and on the extension icon itself.
5.  Once the capture is complete, a standard "Save As" dialog will appear, allowing you to save the `.m4a` audio file to your computer.

## P.S: I recommend pinning the extension to your toolbar when you're downloading to see progress for larger files. Unpin when you're done.
---
