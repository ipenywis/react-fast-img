import React from "react";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";

interface IBaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  icon?: React.ReactNode;
}

const BaseButton: React.FC<IBaseButtonProps> = ({
  text,
  icon,
  ...props
}) => {
  return (
    <button
      className="flex items-center font-bold outline-none pt-4 pb-4 pl-8 pr-8 rounded-xl bg-gray-200 text-black"
      {...props}
    >
      {text}
      <div className="m-2">{icon}</div>
    </button>
  );
};

export default BaseButton;

const BackButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
  return (
    <BaseButton
      {...props}
      text="Go Back"
      icon={<HiOutlineArrowNarrowLeft />}
    />
  );
};

const ForwardButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
  return (
    <BaseButton
      {...props}
      text="Go Home"
      icon={<HiOutlineArrowNarrowRight />}
    />
  );
};

export function GPT4() {
  return (
    <div className="flex space-x-10">
      <ForwardButton />
      <BackButton />
    </div>
  );
}
