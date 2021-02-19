
#### <sup>:closed_book: [looom-tools](../README.md) → Web Exporter → Formats</sup>

---

### Web Exporter Formats

The [Web Exporter](https://looom-tools.netlify.app) currently supports the following formats:

- GIF Animation — *all browsers*
- WebM Video — *Chrome only*
- PNG File Sequence — *Chrome only*
- MP4 Video (H264) — *Chrome Canary only, behind a flag*

To change formats in the Web Exporter, click the Settings (Gear icon) and then change the `Format` drop-down option.

Depending on your browser, you might just see one or two formats. Here's how to use and enable the different formats.

## GIF

Exporting as GIF should work across all browsers.

###### :bulb: *Note: The maximum FPS for a GIF is 50.*

## WebM

WebM is a new type of video format that is not encumbered by patent issues and royalties, but it currently isn't supported across all browsers. The `webm` option should appear in most versions of Chrome, but it may not be present in other browsers.

Once you download the WebM file, there are many free WebM to MP4 converters that you can find online, which may be needed for social media uploading.

###### :bulb: *After downloading, you can use one of the many online ["WebM to MP4" converters](https://cloudconvert.com/webm-to-mp4) to get a file that can be uploaded to social media.*

## PNG File Sequence

This feature relies on a recent version of Chrome, and writes PNG files directly to a folder of your choice. Upon clicking the Record button, you can navigate to a folder (or create a new one) that will hold all the numbered frames. Then, accept the read / write permission boxes that appear, and all frames will be saved sequentially into that folder.

From there, you can use your favourite tool to assemble the image sequence into a high quality video, such as Photoshop, After Effects, etc.

## MP4

Because MP4 is a patented format that incurs royalties for encoding/distribution, we have to rely on experimental encoders within the browser rather than simply distributing a cross-browser encoder. So, MP4 encoding only works on [Chrome Canary](https://www.google.com/intl/en_uk/chrome/canary/) (which is the development build of Chrome) version 90.0.4417.0 or higher.

Once you've installed Chrome Canary, open it and navigate to [chrome://flags/](chrome://flags/) and search for "Experimental Web Platform Features" — set this to "Enabled" and then relaunch Chrome Canary and open the [Looom Web Exporter](https://looom-tools.netlify.app) in it.

###### :bulb: *Note: MP4 exporting is still experimental and may change in the future.*

## 

#### <sup>[← Back to Documentation](../README.md)