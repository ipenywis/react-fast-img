import "./App.css";
import { Gallery } from "./components/Gallery";
import { DIP } from "./principles/DIP";
import { LSP } from "./principles/LSP";
import { OCP } from "./principles/OCP";
import { SRP } from "./principles/SRP";

function App() {
  return (
    <div className="flex flex-col min-w-full h-full justify-center items-center p-8">
      <h1 className="text-4xl font-bold">Summer Gallery</h1>
      <Gallery />
    </div>
  );
}

export default App;
