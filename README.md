# looom-tools

A suite of JavaScript-based tools for parsing and rendering Looom animation software files. *This project is experimental/WIP.*

##### :sparkles: Web Exporter → [looom-tools.netlify.app](https://looom-tools.netlify.app/)

## Looom

[Looom](https://www.iorama.studio/looom) is an experimental animation software for iOS tablets, which allows you to draw and animate short loops like this:

![animation](./docs/animation.gif)

> ###### This is the "Earthy" loop that comes packaged with Looom

The drawings are recorded as vector shapes, and saved as SVG on your iPad, so they can be accessed and shared from the Files application.

## Looom-Tools

This package and website is a small suite of tools for working with Looom's SVG files, allowing you to render them in real-time on the web, re-export them with different settings, and parse and restructure them programmatically. In this way, Looom could be used as a general purpose animation software for the web, in the way that Lottie is often used for scalable web animations.

### Website

One facet of this project is an easy-to-use web renderer and exporter, allowing for GIF/MP4/WebM exporting of your loops. See [looom-tools.netlify.app](https://looom-tools.netlify.app/).

### Parsing API / CLI

Another facet of this project is parsing the `.SVG` files from Looom into a more manageable JSON format. This could be useful for developers wishing to build more extensions/hacks/renderers on top of the file format.

*This is still WIP.*

### Rendering API

The third part of this project is a working web-based renderer of the parsed JSON file that achieves feature parity with Looom, as well as a few additional features. This can help make Looom a more general purpose animation framework for the web, in the way that Lottie is often used for web animations, and also provides a reference for those wishing to implement custom renderers (such as with WebGL or another framework) for more specific features.

The current renderer uses Canvas2D, as it seems to be able to achieve feature parity with Looom.

*This is still WIP.*

## What this Enables

Once you start hacking the Looom files, you can do a lot of interesting things that aren't yet possible in the app, such as:

- Processing & cleaning up jagged/low-detail curves (this library includes a `{resamplePaths}` option)
- Changing colors and other rendering parameters procedurally
- Exporting at specific dimensions and formats (SVG/PNG frames, MP4/GIF)
- Combining weaves to create animations with more than 5 threads, or higher frame rate / frame counts
- Introducing real-time interactivity to your loops
- & more...

## Progress

If you'd like to contribute, please open an issue. Some things still need to be worked on:

- Docs & API cleanup
- CLI tool for converting Looom SVG to JSON (allowing for a slimmer web parser)
- Improving polyline offsetting code for edge cases
- Testing different files to ensure feature parity with Looom
- Examples of more interactive loops
- Improving the overall UX/UI and design of the website.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/looom-tools/blob/master/LICENSE.md) for details.
