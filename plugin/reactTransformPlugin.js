import BabelParser from "@babel/parser";
import traverse from "@babel/traverse";
import t from "@babel/types";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { jsxAttribute } from "@babel/types";

import babelCore from "@babel/core";

export const imageConfigDefault = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  path: "./public/assets/generated",
  // loader: "default",
  // loaderFile: "",
  // domains: [],
  // disableStaticImages: false,
  // minimumCacheTTL: 60,
  format: "image/webp",
  // dangerouslyAllowSVG: false,
  // contentSecurityPolicy: `script-src 'none'; frame-src 'none'; sandbox;`,
  // contentDispositionType: "inline",
  // remotePatterns: [],
  // unoptimized: false,
};

function getDefaultConfig() {
  const c = imageConfigDefault;
  const allSizes = [...c.deviceSizes, ...c.imageSizes].sort(
    (a, b) => a - b
  );
  const deviceSizes = c.deviceSizes.sort((a, b) => a - b);
  return { ...c, allSizes, deviceSizes };
}

function getSystemImageSrc(src) {
  return path.join("./public", src);
}

async function readImageSize(path) {
  try {
    const imageInfo = await sharp(path).metadata();
    const { width, height } = imageInfo;

    return { width, height };
  } catch (error) {
    console.error("Error reading image size:", error);
  }
}

function getWidths({ deviceSizes, allSizes }, width, sizes) {
  if (sizes) {
    // Find all the "vw" percent sizes used in the sizes prop
    const viewportWidthRe = /(^|\s)(1?\d?\d)vw/g;
    const percentSizes = [];
    for (let match; (match = viewportWidthRe.exec(sizes)); match) {
      percentSizes.push(parseInt(match[2]));
    }
    if (percentSizes.length) {
      const smallestRatio = Math.min(...percentSizes) * 0.01;
      return {
        widths: allSizes.filter(
          (s) => s >= deviceSizes[0] * smallestRatio
        ),
        kind: "w",
      };
    }
    return { widths: allSizes, kind: "w" };
  }
  if (typeof width !== "number") {
    return { widths: deviceSizes, kind: "w" };
  }

  const widths = [
    ...new Set(
      // > This means that most OLED screens that say they are 3x resolution,
      // > are actually 3x in the green color, but only 1.5x in the red and
      // > blue colors. Showing a 3x resolution image in the app vs a 2x
      // > resolution image will be visually the same, though the 3x image
      // > takes significantly more data. Even true 3x resolution screens are
      // > wasteful as the human eye cannot see that level of detail without
      // > something like a magnifying glass.
      // https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices.html
      [width, width * 2 /*, width * 3*/].map(
        (w) =>
          allSizes.find((p) => p >= w) ||
          allSizes[allSizes.length - 1]
      )
    ),
  ];
  return { widths, kind: "x" };
}

function getImageFileNameFromSrc(src) {
  if (!src || src.length === 0) return null;

  const regex = /\/([^/]+)\.\w+$/;
  const matches = src.match(regex);
  const fileName = matches ? matches[1] : null;

  return fileName;
}

async function writeImageWidthsToPublic(
  config,
  originalSrc,
  widths,
  kind
) {
  const { path } = config;

  const generatedImagesPaths = [];

  try {
    for (const width of widths) {
      const outputPath = `${path}/${getImageFileNameFromSrc(
        originalSrc
      )}-${width}${kind}.webp`;
      const resizedImage = await sharp(originalSrc)
        .resize(width)
        .webp({ quality: 75 })
        .toFile(outputPath);
      // await fs.writeFile(outputPath, resizedImage);

      generatedImagesPaths.push({ width, path: outputPath });
      console.log(`Image generated: ${outputPath}`);
    }

    return generatedImagesPaths;
  } catch (error) {
    console.error("Error generating images:", error);
    return null;
  }
}

function imageLoader(generatedImagesPaths) {
  return (imageWidth) => {
    return generatedImagesPaths.find(
      ({ width }) => width === imageWidth
    ).path;
  };
}

async function generateImage(config, src, sizes, trackingIdx) {
  const { width } = await readImageSize(src);
  const { widths, kind } = getWidths(config, width, sizes);

  const generatedImagesPaths = await writeImageWidthsToPublic(
    config,
    src,
    widths,
    kind || "w"
  );

  const loader = imageLoader(generatedImagesPaths);

  const imageAttributes = generateImgAttrs(
    widths,
    sizes,
    kind || "w",
    loader,
    trackingIdx
  );

  return imageAttributes;
}

function generateImgAttrs(widths, sizes, kind, loader, trackingIdx) {
  const last = widths.length - 1;

  const attributes = {
    sizes: !sizes && kind === "w" ? "100vw" : sizes,
    srcSet: widths
      .map(
        (w, i) => `${loader(w)} ${kind === "w" ? w : i + 1}${kind}`
      )
      .join(", "),

    // It's intended to keep `src` the last attribute because React updates
    // attributes in order. If we keep `src` the first one, Safari will
    // immediately start to fetch `src`, before `sizes` and `srcSet` are even
    // updated by React. That causes multiple unnecessary requests if `srcSet`
    // and `sizes` are defined.
    // This bug cannot be reproduced in Chrome or Firefox.
    src: loader(widths[last]),
    trackingIdx,
  };

  return attributes;
}

async function getImageNewAttributes(src, sizes, trackingIdx) {
  const imageAttributes = await generateImage(
    getDefaultConfig(),
    getSystemImageSrc(src),
    sizes,
    trackingIdx
  );

  return imageAttributes;
}

function getImageElementsToConvert(ast) {
  const imgElementsToConvert = [];
  let trackingIdx = 0;

  traverse.default(ast, {
    JSXOpeningElement(path) {
      if (
        t.isJSXElement(path.node, { name: "StyledImage" }) ||
        path.node.name.name === "StyledImage"
      ) {
        let src = null;
        let srcNode = null;
        let sizes = null;
        let sizesNode = null;
        let parentNode = path.node;
        if (path.node.attributes.length >= 1) {
          for (const [
            idx,
            attribute,
          ] of path.node.attributes.entries()) {
            if (attribute.name.name === "sizes") {
              sizes = attribute.value.value;
              sizesNode = attribute;
            }
            if (attribute.name.name === "src") {
              src = attribute.value.value;
              srcNode = attribute;
            }

            if (src && sizes) {
              imgElementsToConvert.push({
                trackingIdx,
                src,
                sizes,
                parentNode,
              });

              trackingIdx += 1;
              break;
            }
          }
        }
      }
    },
  });

  return imgElementsToConvert;
}

function transform(ast, newImageAttributes) {
  let trackingIdx = 0;

  traverse.default(ast, {
    JSXOpeningElement(path) {
      if (
        t.isJSXElement(path.node, { name: "StyledImage" }) ||
        path.node.name.name === "StyledImage"
      ) {
        let src = null;
        let srcNode = null;
        let sizes = null;
        let sizesNode = null;
        let parentNode = path.node;
        if (path.node.attributes.length >= 1) {
          for (const [
            idx,
            attribute,
          ] of path.node.attributes.entries()) {
            if (attribute.name.name === "sizes") {
              sizes = attribute.value.value;
              sizesNode = attribute;
            }
            if (attribute.name.name === "src") {
              src = attribute.value.value;
              srcNode = attribute;
            }

            if (src && sizes) {
              const currentImageAttributes = newImageAttributes.find(
                (img) => img.trackingIdx === trackingIdx
              );
              const srcSetAttribute = jsxAttribute(
                t.jsxIdentifier("srcSet"),
                t.stringLiteral(currentImageAttributes.srcSet)
              );
              parentNode.attributes.push(srcSetAttribute);

              trackingIdx += 1;
              break;
            }
          }
        }
      }
    },
  });
}

async function parseCode(code) {
  const ast = BabelParser.parse(code, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  const imageElementsToConvert = getImageElementsToConvert(ast);

  const newImagesAttributes = [];

  for (const imageElement of imageElementsToConvert) {
    const attributes = await getImageNewAttributes(
      imageElement.src,
      imageElement.sizes,
      imageElement.trackingIdx
    );
    newImagesAttributes.push(attributes);
  }

  transform(ast, newImagesAttributes);

  const { code: generatedCode } = babelCore.transformFromAstSync(
    ast,
    null
  );
  return generatedCode;
}

// reactTransformPlugin.js
const reactTransformPlugin = () => {
  return {
    name: "react-transform-plugin",
    async transform(code, id) {
      //Right now it only tracks changed inside Gallery.tsx (hardcoded filename)
      //When publishing we need to remove this limitation
      //And test in dev env
      if (id.includes("Gallery.tsx")) {
        const generatedCode = await parseCode(code);
        return { code: generatedCode };
      }
    },
  };
};

export default reactTransformPlugin;
