import styled from "styled-components";

const IMAGES = [
  "/assets/rolands.jpg",
  "/assets/fabio.jpg",
  // "/assets/redd.jpg",
  // "/assets/jairph.jpg",
  "/assets/clarisse.jpg",
];

const StyledImage = styled.img`
  /* height: 600px; */
  border-radius: 6px;
  margin: 1rem;
  border: 2px solid white;

  height: 400px;

  @media screen and (max-width: 400px) {
    height: 100px;
  }

  @media screen and (max-width: 600px) {
    height: 200px;
  }

  @media screen and (max-width: 1024px) {
    height: 300px;
  }
`;

export function Gallery() {
  return (
    <div className="flex w-full mt-20 justify-center">
      <StyledImage
        alt="Roalands Image"
        // srcSet={`/assets/responsive/rolands-330w.webp 330w, /assets/responsive/rolands-768w.webp 768w, /assets/responsive/rolands-1024w.webp 1024w`}
        sizes="(max-width: 769px) 3vw, (max-width: 1024px) 10vw, 100vw"
        src="/assets/rolands.jpg"
      />
      <StyledImage
        alt="Fabio Image"
        // srcSet={`/assets/responsive/fabio-330w.webp 330w, /assets/responsive/fabio-768w.webp 768w, /assets/responsive/fabio-1024w.webp 1024w`}
        sizes="(max-width: 769px) 3vw, (max-width: 1024px) 10vw, 100vw"
        src="/assets/fabio.jpg"
      />
      {/* Pixel Density */}
      {/* <StyledImage
        alt={"Fabio Image"}
        srcSet={`/assets/responsive/rolands-330w.webp, /assets/responsive/rolands-768w.webp 1.5x, /assets/responsive/rolands-1024w.webp 2x`}
        // sizes="(max-width: 769px) 33vw, (max-width: 1024px) 50vw, 5vw"
      /> */}
    </div>
  );
}
