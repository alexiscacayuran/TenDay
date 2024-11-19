// src/components/CustomIcons.js
import React from "react";
import { SVGIcon } from "@mui/material";
import {
  HeavyRainsCloudy,
  HeavyRainsMosCloudy,
  HeavyRainsParCloudy,
  LightRainsCloudy,
  LightRainsMosCloudy,
  LightRainsParCloudy,
  ModRainsCloudy,
  ModRainsMosCloudy,
  ModRainsParCloudy,
  NoRainCloudy,
  NoRainMosCloudy,
  NoRainParCloudy,
} from "../../public/icons";

const IconWrapper = ({ Icon, ...props }) => (
  <SVGIcon {...props}>
    <Icon />
  </SVGIcon>
);

export const HeavyRainsCloudyIcon = (props) => (
  <IconWrapper Icon={HeavyRainsCloudy} {...props} />
);
export const HeavyRainsMosCloudyIcon = (props) => (
  <IconWrapper Icon={HeavyRainsMosCloudy} {...props} />
);
export const HeavyRainsParCloudyIcon = (props) => (
  <IconWrapper Icon={HeavyRainsParCloudy} {...props} />
);

export const LightRainsCloudyIcon = (props) => (
  <IconWrapper Icon={LightRainsCloudy} {...props} />
);
export const LightRainsMosCloudyIcon = (props) => (
  <IconWrapper Icon={LightRainsMosCloudy} {...props} />
);
export const LightRainsParCloudyIcon = (props) => (
  <IconWrapper Icon={LightRainsParCloudy} {...props} />
);

export const ModRainsCloudyIcon = (props) => (
  <IconWrapper Icon={ModRainsCloudy} {...props} />
);
export const ModRainsMosCloudyIcon = (props) => (
  <IconWrapper Icon={ModRainsMosCloudy} {...props} />
);
export const ModRainsParCloudyIcon = (props) => (
  <IconWrapper Icon={ModRainsParCloudy} {...props} />
);

export const NoRainCloudyIcon = (props) => (
  <IconWrapper Icon={NoRainCloudy} {...props} />
);
export const NoRainMosCloudyIcon = (props) => (
  <IconWrapper Icon={NoRainMosCloudy} {...props} />
);
export const NoRainParCloudyIcon = (props) => (
  <IconWrapper Icon={NoRainParCloudy} {...props} />
);
