import React from "react";
import { Tooltip } from "@mui/joy";
import { SvgIcon } from "@mui/material";
import { Image } from "@react-pdf/renderer";

import Sunny from "../assets/icons/weather/0-sunny.svg";

import NoRainParCloudy from "../assets/icons/weather/1-no-rain_partly-cloudy.svg";
import NoRainMosCloudy from "../assets/icons/weather/2-no-rain_mostly-cloudy.svg";
import NoRainCloudy from "../assets/icons/weather/3-no-rain_cloudy.svg";

import LightRainsParCloudy from "../assets/icons/weather/4-light-rains_partly-cloudy.svg";
import LightRainsMosCloudy from "../assets/icons/weather/5-light-rains_mostly-cloudy.svg";
import LightRainsCloudy from "../assets/icons/weather/6-light-rains_cloudy.svg";

import ModRainsParCloudy from "../assets/icons/weather/7-mod-rains_partly-cloudy.svg";
import ModRainsMosCloudy from "../assets/icons/weather/8-mod-rains_mostly-cloudy.svg";
import ModRainsCloudy from "../assets/icons/weather/9-mod-rains_cloudy.svg";

import HeavyRainsParCloudy from "../assets/icons/weather/10-heavy-rains_partly-cloudy.svg";
import HeavyRainsMosCloudy from "../assets/icons/weather/11-heavy-rains_mostly-cloudy.svg";
import HeavyRainsCloudy from "../assets/icons/weather/12-heavy-rains_cloudy.svg";

import LightRainsSunny from "../assets/icons/weather/13-light-rains_sunny.svg";

import SunnyPNG from "../assets/icons/weather/0-sunny.png";

import NoRainParCloudyPNG from "../assets/icons/weather/1-no-rain_partly-cloudy.png";
import NoRainMosCloudyPNG from "../assets/icons/weather/2-no-rain_mostly-cloudy.png";
import NoRainCloudyPNG from "../assets/icons/weather/3-no-rain_cloudy.png";

import LightRainsParCloudyPNG from "../assets/icons/weather/4-light-rains_partly-cloudy.png";
import LightRainsMosCloudyPNG from "../assets/icons/weather/5-light-rains_mostly-cloudy.png";
import LightRainsCloudyPNG from "../assets/icons/weather/6-light-rains_cloudy.png";

import ModRainsParCloudyPNG from "../assets/icons/weather/7-mod-rains_partly-cloudy.png";
import ModRainsMosCloudyPNG from "../assets/icons/weather/8-mod-rains_mostly-cloudy.png";
import ModRainsCloudyPNG from "../assets/icons/weather/9-mod-rains_cloudy.png";

import HeavyRainsParCloudyPNG from "../assets/icons/weather/10-heavy-rains_partly-cloudy.png";
import HeavyRainsMosCloudyPNG from "../assets/icons/weather/11-heavy-rains_mostly-cloudy.png";
import HeavyRainsCloudyPNG from "../assets/icons/weather/12-heavy-rains_cloudy.png";

import LightRainsSunnyPNG from "../assets/icons/weather/13-light-rains_sunny.png";

import SunnyLgPNG from "../assets/icons/weather/0-sunny-lg.png";

import NoRainParCloudyLgPNG from "../assets/icons/weather/1-no-rain_partly-cloudy-lg.png";
import NoRainMosCloudyLgPNG from "../assets/icons/weather/2-no-rain_mostly-cloudy-lg.png";
import NoRainCloudyLgPNG from "../assets/icons/weather/3-no-rain_cloudy-lg.png";

import LightRainsParCloudyLgPNG from "../assets/icons/weather/4-light-rains_partly-cloudy-lg.png";
import LightRainsMosCloudyLgPNG from "../assets/icons/weather/5-light-rains_mostly-cloudy-lg.png";
import LightRainsCloudyLgPNG from "../assets/icons/weather/6-light-rains_cloudy-lg.png";

import ModRainsParCloudyLgPNG from "../assets/icons/weather/7-mod-rains_partly-cloudy-lg.png";
import ModRainsMosCloudyLgPNG from "../assets/icons/weather/8-mod-rains_mostly-cloudy-lg.png";
import ModRainsCloudyLgPNG from "../assets/icons/weather/9-mod-rains_cloudy-lg.png";

import HeavyRainsParCloudyLgPNG from "../assets/icons/weather/10-heavy-rains_partly-cloudy-lg.png";
import HeavyRainsMosCloudyLgPNG from "../assets/icons/weather/11-heavy-rains_mostly-cloudy-lg.png";
import HeavyRainsCloudyLgPNG from "../assets/icons/weather/12-heavy-rains_cloudy-lg.png";

import LightRainsSunnyLgPNG from "../assets/icons/weather/13-light-rains_sunny-lg.png";

import { ReactComponent as N } from "../assets/icons/wind-direction/0-n.svg";
import { ReactComponent as NNE } from "../assets/icons/wind-direction/1-nne.svg";
import { ReactComponent as NE } from "../assets/icons/wind-direction/2-ne.svg";
import { ReactComponent as ENE } from "../assets/icons/wind-direction/3-ene.svg";

import { ReactComponent as E } from "../assets/icons/wind-direction/4-e.svg";
import { ReactComponent as ESE } from "../assets/icons/wind-direction/5-ese.svg";
import { ReactComponent as SE } from "../assets/icons/wind-direction/6-se.svg";
import { ReactComponent as SSE } from "../assets/icons/wind-direction/7-sse.svg";

import { ReactComponent as S } from "../assets/icons/wind-direction/8-s.svg";
import { ReactComponent as SSW } from "../assets/icons/wind-direction/9-ssw.svg";
import { ReactComponent as SW } from "../assets/icons/wind-direction/10-sw.svg";
import { ReactComponent as WSW } from "../assets/icons/wind-direction/11-wsw.svg";

import { ReactComponent as W } from "../assets/icons/wind-direction/12-w.svg";
import { ReactComponent as WNW } from "../assets/icons/wind-direction/13-wnw.svg";
import { ReactComponent as NW } from "../assets/icons/wind-direction/14-nw.svg";
import { ReactComponent as NNW } from "../assets/icons/wind-direction/15-nnw.svg";

import NPNG from "../assets/icons/wind-direction/0-n.png";
import NNEPNG from "../assets/icons/wind-direction/1-nne.png";
import NEPNG from "../assets/icons/wind-direction/2-ne.png";
import ENEPNG from "../assets/icons/wind-direction/3-ene.png";

import EPNG from "../assets/icons/wind-direction/4-e.png";
import ESEPNG from "../assets/icons/wind-direction/5-ese.png";
import SEPNG from "../assets/icons/wind-direction/6-se.png";
import SSEPNG from "../assets/icons/wind-direction/7-sse.png";

import SPNG from "../assets/icons/wind-direction/8-s.png";
import SSWPNG from "../assets/icons/wind-direction/9-ssw.png";
import SWPNG from "../assets/icons/wind-direction/10-sw.png";
import WSWPNG from "../assets/icons/wind-direction/11-wsw.png";

import WPNG from "../assets/icons/wind-direction/12-w.png";
import WNWPNG from "../assets/icons/wind-direction/13-wnw.png";
import NWPNG from "../assets/icons/wind-direction/14-nw.png";
import NNWPNG from "../assets/icons/wind-direction/15-nnw.png";

import { ReactComponent as TMax } from "../assets/icons/buttons/tmax.svg";
import { ReactComponent as TMean } from "../assets/icons/buttons/tmean.svg";
import { ReactComponent as TMin } from "../assets/icons/buttons/tmin.svg";

import { ReactComponent as LayerStyle } from "../assets/icons/buttons/layer-style.svg";
import { ReactComponent as Gradient } from "../assets/icons/buttons/gradient.svg";
import { ReactComponent as Particles } from "../assets/icons/buttons/particles.svg";

import Logo from "../assets/logo/logo-rgb-light.png";
import { ReactComponent as Logotype } from "../assets/logo/logotype-light.svg";
import LogoDark from "../assets/logo/logo-rgb-dark.png";
import PAGASA from "../assets/logo/pagasa-logo.png";
import BMUVIK from "../assets/logo/bmuv-iki-logo.png";
import GIZ from "../assets/logo/giz-logo.png";
import NoResult from "../assets/images/no-result.png";

const ImgPDFWrapper = ({ src, style, ...props }) => (
  <Image src={src} style={{ width: "30px", ...style }} {...props} />
);

const ImgWrapper = ({ Icon, Title, ...props }) => (
  <Tooltip title={Title} color="primary" placement="bottom" variant="soft">
    <img
      draggable="false"
      src={Icon}
      {...props}
      style={{ width: "30px" }}
    ></img>
  </Tooltip>
);

const SvgWrapper = ({ Icon, ...props }) => (
  <SvgIcon
    {...props}
    draggable="false"
    sx={{ width: "20px", fontSize: "1rem", boxSizing: "border-box" }}
  >
    <Icon />
  </SvgIcon>
);

export const NoResultImage = (props) => (
  <img src={NoResult} style={{ width: "230px" }} {...props} />
);

export const TenDayLogo = (props) => {
  <img src={Logo} {...props} style={{ height: "45px" }}></img>;
};

export const TenDayLogoDark = (props) => {
  <img src={LogoDark} {...props} style={{ height: "40px" }}></img>;
};

export const TenDayLogoType = (props) => (
  <SvgIcon {...props} style={{ fontSize: "5rem", margin: "-34px 0" }}>
    <Logotype />
  </SvgIcon>
);

export const PAGASALogo = (props) => (
  <img
    src={PAGASA}
    {...props}
    style={{ height: "35px", marginRight: "10px" }}
  ></img>
);

export const GIZLogo = (props) => (
  <img src={GIZ} {...props} style={{ width: "100px", margin: "-25px 0" }}></img>
);

export const BMUVIKILogo = (props) => (
  <img src={BMUVIK} {...props} style={{ width: "200px" }}></img>
);

export const LayerStyleIcon = (props) => (
  <SvgIcon {...props}>
    <LayerStyle />
  </SvgIcon>
);

export const GradientIcon = (props) => (
  <SvgIcon {...props}>
    <Gradient />
  </SvgIcon>
);

export const ParticlesIcon = (props) => (
  <SvgIcon {...props}>
    <Particles />
  </SvgIcon>
);

export const TMaxIcon = (props) => (
  <SvgIcon {...props}>
    <TMax />
  </SvgIcon>
);
export const TMeanIcon = (props) => (
  <SvgIcon {...props}>
    <TMean />
  </SvgIcon>
);
export const TMinIcon = (props) => (
  <SvgIcon {...props}>
    <TMin />
  </SvgIcon>
);

export const SunnyIcon = (props) => (
  <ImgWrapper Icon={Sunny} Title={<>Sunny</>} {...props} />
);

export const NoRainParCloudyIcon = (props) => (
  <ImgWrapper Icon={NoRainParCloudy} Title={<>Partly Cloudy</>} {...props} />
);
export const NoRainMosCloudyIcon = (props) => (
  <ImgWrapper Icon={NoRainMosCloudy} Title={<>Mostly Cloudy</>} {...props} />
);
export const NoRainCloudyIcon = (props) => (
  <ImgWrapper Icon={NoRainCloudy} Title={<>Cloudy</>} {...props} />
);

export const LightRainsParCloudyIcon = (props) => (
  <ImgWrapper
    Icon={LightRainsParCloudy}
    Title={
      <>
        Light Rains
        <br />
        Partly Cloudy
      </>
    }
    {...props}
  />
);
export const LightRainsMosCloudyIcon = (props) => (
  <ImgWrapper
    Icon={LightRainsMosCloudy}
    Title={
      <>
        Light Rains
        <br />
        Mostly Cloudy
      </>
    }
    {...props}
  />
);
export const LightRainsCloudyIcon = (props) => (
  <ImgWrapper
    Icon={LightRainsCloudy}
    Title={
      <>
        Light Rains
        <br />
        Cloudy
      </>
    }
    {...props}
  />
);

export const ModRainsParCloudyIcon = (props) => (
  <ImgWrapper
    Icon={ModRainsParCloudy}
    Title={
      <>
        Moderate Rains
        <br />
        Partly Cloudy
      </>
    }
    {...props}
  />
);
export const ModRainsMosCloudyIcon = (props) => (
  <ImgWrapper
    Icon={ModRainsMosCloudy}
    Title={
      <>
        Moderate Rains
        <br />
        Mostly Cloudy
      </>
    }
    {...props}
  />
);
export const ModRainsCloudyIcon = (props) => (
  <ImgWrapper
    Icon={ModRainsCloudy}
    Title={
      <>
        Moderate Rains
        <br />
        Cloudy
      </>
    }
    {...props}
  />
);

export const HeavyRainsParCloudyIcon = (props) => (
  <ImgWrapper
    Icon={HeavyRainsParCloudy}
    Title={
      <>
        Heavy Rains
        <br />
        Partly Cloudy
      </>
    }
    {...props}
  />
);
export const HeavyRainsMosCloudyIcon = (props) => (
  <ImgWrapper
    Icon={HeavyRainsMosCloudy}
    Title={
      <>
        Heavy Rains
        <br />
        Mostly Cloudy
      </>
    }
    {...props}
  />
);
export const HeavyRainsCloudyIcon = (props) => (
  <ImgWrapper
    Icon={HeavyRainsCloudy}
    Title={
      <>
        Heavy Rains
        <br />
        Cloudy
      </>
    }
    {...props}
  />
);

export const LightRainsSunnyIcon = (props) => (
  <ImgWrapper
    Icon={LightRainsSunny}
    Title={
      <>
        Light Rains
        <br />
        Sunny
      </>
    }
    {...props}
  />
);

export const SunnyIconPDF = (props) => (
  <ImgPDFWrapper src={SunnyPNG} {...props} />
);

export const NoRainParCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={NoRainParCloudyPNG} {...props} />
);

export const NoRainMosCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={NoRainMosCloudyPNG} {...props} />
);

export const NoRainCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={NoRainCloudyPNG} {...props} />
);

export const LightRainsParCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={LightRainsParCloudyPNG} {...props} />
);

export const LightRainsMosCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={LightRainsMosCloudyPNG} {...props} />
);

export const LightRainsCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={LightRainsCloudyPNG} {...props} />
);

export const ModRainsParCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={ModRainsParCloudyPNG} {...props} />
);

export const ModRainsMosCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={ModRainsMosCloudyPNG} {...props} />
);

export const ModRainsCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={ModRainsCloudyPNG} {...props} />
);

export const HeavyRainsParCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={HeavyRainsParCloudyPNG} {...props} />
);

export const HeavyRainsMosCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={HeavyRainsMosCloudyPNG} {...props} />
);

export const HeavyRainsCloudyIconPDF = (props) => (
  <ImgPDFWrapper src={HeavyRainsCloudyPNG} {...props} />
);

export const LightRainsSunnyIconPDF = (props) => (
  <ImgPDFWrapper src={LightRainsSunnyPNG} {...props} />
);

export const SunnyIconLgPDF = (props) => (
  <ImgPDFWrapper src={SunnyLgPNG} {...props} />
);

export const NoRainParCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={NoRainParCloudyLgPNG} {...props} />
);

export const NoRainMosCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={NoRainMosCloudyLgPNG} {...props} />
);

export const NoRainCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={NoRainCloudyLgPNG} {...props} />
);

export const LightRainsParCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={LightRainsParCloudyLgPNG} {...props} />
);

export const LightRainsMosCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={LightRainsMosCloudyLgPNG} {...props} />
);

export const LightRainsCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={LightRainsCloudyLgPNG} {...props} />
);

export const ModRainsParCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={ModRainsParCloudyLgPNG} {...props} />
);

export const ModRainsMosCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={ModRainsMosCloudyLgPNG} {...props} />
);

export const ModRainsCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={ModRainsCloudyLgPNG} {...props} />
);

export const HeavyRainsParCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={HeavyRainsParCloudyLgPNG} {...props} />
);

export const HeavyRainsMosCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={HeavyRainsMosCloudyLgPNG} {...props} />
);

export const HeavyRainsCloudyIconLgPDF = (props) => (
  <ImgPDFWrapper src={HeavyRainsCloudyLgPNG} {...props} />
);

export const LightRainsSunnyIconLgPDF = (props) => (
  <ImgPDFWrapper src={LightRainsSunnyLgPNG} {...props} />
);

export const NIcon = (props) => <SvgWrapper Icon={N} {...props} />;
export const NNEIcon = (props) => <SvgWrapper Icon={NNE} {...props} />;
export const NEIcon = (props) => <SvgWrapper Icon={NE} {...props} />;
export const ENEIcon = (props) => <SvgWrapper Icon={ENE} {...props} />;

export const EIcon = (props) => <SvgWrapper Icon={E} {...props} />;
export const ESEIcon = (props) => <SvgWrapper Icon={ESE} {...props} />;
export const SEIcon = (props) => <SvgWrapper Icon={SE} {...props} />;
export const SSEIcon = (props) => <SvgWrapper Icon={SSE} {...props} />;

export const SIcon = (props) => <SvgWrapper Icon={S} {...props} />;
export const SSWIcon = (props) => <SvgWrapper Icon={SSW} {...props} />;
export const SWIcon = (props) => <SvgWrapper Icon={SW} {...props} />;
export const WSWIcon = (props) => <SvgWrapper Icon={WSW} {...props} />;

export const WIcon = (props) => <SvgWrapper Icon={W} {...props} />;
export const WNWIcon = (props) => <SvgWrapper Icon={WNW} {...props} />;
export const NWIcon = (props) => <SvgWrapper Icon={NW} {...props} />;
export const NNWIcon = (props) => <SvgWrapper Icon={NNW} {...props} />;

export const NIconPDF = (props) => <ImgPDFWrapper src={NPNG} {...props} />;
export const NNEIconPDF = (props) => <ImgPDFWrapper src={NNEPNG} {...props} />;
export const NEIconPDF = (props) => <ImgPDFWrapper src={NEPNG} {...props} />;
export const ENEIconPDF = (props) => <ImgPDFWrapper src={ENEPNG} {...props} />;

export const EIconPDF = (props) => <ImgPDFWrapper src={EPNG} {...props} />;
export const ESEIconPDF = (props) => <ImgPDFWrapper src={ESEPNG} {...props} />;
export const SEIconPDF = (props) => <ImgPDFWrapper src={SEPNG} {...props} />;
export const SSEIconPDF = (props) => <ImgPDFWrapper src={SSEPNG} {...props} />;

export const SIconPDF = (props) => <ImgPDFWrapper src={SPNG} {...props} />;
export const SSWIconPDF = (props) => <ImgPDFWrapper src={SSWPNG} {...props} />;
export const SWIconPDF = (props) => <ImgPDFWrapper src={SWPNG} {...props} />;
export const WSWIconPDF = (props) => <ImgPDFWrapper src={WSWPNG} {...props} />;

export const WIconPDF = (props) => <ImgPDFWrapper src={WPNG} {...props} />;
export const WNWIconPDF = (props) => <ImgPDFWrapper src={WNWPNG} {...props} />;
export const NWIconPDF = (props) => <ImgPDFWrapper src={NWPNG} {...props} />;
export const NNWIconPDF = (props) => <ImgPDFWrapper src={NNWPNG} {...props} />;
