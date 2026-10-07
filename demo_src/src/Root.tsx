import React, {useEffect, useState} from 'react';
import {Composition, continueRender, delayRender} from 'remotion';
import {IPVideo, IP_DUR} from './IP';
import {SRMVideo, SRM_DUR} from './SRM';
import {GRGVideo, GRG_DUR} from './GRG';
import {FPS, H, W} from './theme';

// Block rendering until every Inter weight we use is loaded.
const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px Inter`, 'Aρ–·…>')))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};

const wrap = (C: React.FC) => () => <FontGate><C /></FontGate>;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="IP" component={wrap(IPVideo)} durationInFrames={IP_DUR} fps={FPS} width={W} height={H} />
    <Composition id="SRM" component={wrap(SRMVideo)} durationInFrames={SRM_DUR} fps={FPS} width={W} height={H} />
    <Composition id="GRG" component={wrap(GRGVideo)} durationInFrames={GRG_DUR} fps={FPS} width={W} height={H} />
  </>
);
