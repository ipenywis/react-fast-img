# React Image Optimization (srcSet & sizes) using a Custom Vite Plugin

## Option 1: Using Gulp

You can use gulp script to auto-generate images for different resolutions (e.g 1024, 768, 324) and later use those images inside your srcSet to improve developer experience and save you time

```
yarn gulp:generate-images
```

This will output the images inside `public/assets/responsive`

## Option 2: Using Custom Vite Plugin (Recommended)

So because I search everywhere about a good plugin/tool to auto-generate images providing only the sizes attribute inside the `<img />` element, something good as the Next/Image component implemented inside the new Next v13. But you no luck finding it! So the best solution is to create it.

Navigate to `plugin/reactTransformPlugin.js` and you will find a vite plugin that uses babel to read jsx and generate images for you on the fly, going from the `src` & `sizes` attributes on the `<img />` element.

For now, it's only limited to read from the `Gallery.tsx` component just as a prove of concept. if you like the plugin and want it to be published please open a issue or let me know and I will do my best to ge it polished and published on **NPM** for everyone to enjoy the best DX.

To use the plugin in your project (temporarly for now) you can copy the plugin folder and then import it inside your vite config:

```js
//vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import reactTransformPlugin from "./plugin/reactTransformPlugin";

// https://vitejs.dev/config/
export default defineConfig({
  //Make sure to run our plugin before anyother plugin and particularly before the React plugin
  plugins: [{ ...reactTransformPlugin(), enforce: "pre" }, react()],
});
```
