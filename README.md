# looom-tools

A suite of JavaScript-based tools for parsing and rendering Looom animation software files.

This project is WIP, I'd be happy to receive contributions around the website design/UX.

[https://looom-tools.netlify.app/](https://looom-tools.netlify.app/)

## What This Includes

This project has two goals: first, parsing `.SVG` files from Looom into a more manageable JSON format, this could be useful for developers wishing to build more extensions/hacks/renderers on top of the file format. The second is to provide a working web-based renderer of that JSON file that achieves feature parity with Looom rendering, as well as a few additional features. This can help make Looom a more general purpose animation framework for the web, in the way that Lottie is often used for web animations.

The current renderer uses Canvas2D, as it seems to be able to achieve feature parity with Looom.

## What's Missing / WIP

The website is missing UX/UI and export/playback functionality. The libraries are not yet released on npm, and not yet usable in production. Obviously no docs yet. The path offsetting works very closely to loom, but has a few edge cases where it results in different line thicknesses. Otherwise, most of the files seem to be rendering very closely to the Looom application.

## Extra Features

Once you start hacking the Looom files, you can do a lot of interesting things that aren't yet possible in the app, such as:

- Processing & cleaning up jagged/low-detail curves (this library includes a `{resamplePaths}` option)
- Changing colors and other rendering parameters procedurally
- Exporting at specific dimensions and formats (SVG/PNG frames, MP4/GIF)
- Combining weaves to create animations with more than 5 threads, or higher frame rate / frame counts

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/looom-tools/blob/master/LICENSE.md) for details.
