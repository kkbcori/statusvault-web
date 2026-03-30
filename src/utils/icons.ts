import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export type IconName =
  | 'passport' | 'passport2' | 'passport_card'
  | 'visa' | 'visa2' | 'visa_approved'
  | 'travel' | 'travel2' | 'travel_plane'
  | 'checklist' | 'checklist2'
  | 'timer' | 'timer2'
  | 'calendar' | 'expiry'
  | 'biometrics' | 'application' | 'interview';

export const ICON_MAP: Record<IconName, any> = {
  passport:      require('../../assets/icons/passport.png'),
  passport2:     require('../../assets/icons/passport2.png'),
  passport_card: require('../../assets/icons/passport_card.png'),
  visa:          require('../../assets/icons/visa.png'),
  visa2:         require('../../assets/icons/visa2.png'),
  visa_approved: require('../../assets/icons/visa_approved.png'),
  travel:        require('../../assets/icons/travel.png'),
  travel2:       require('../../assets/icons/travel2.png'),
  travel_plane:  require('../../assets/icons/travel_plane.png'),
  checklist:     require('../../assets/icons/checklist.png'),
  checklist2:    require('../../assets/icons/checklist2.png'),
  timer:         require('../../assets/icons/timer.png'),
  timer2:        require('../../assets/icons/timer2.png'),
  calendar:      require('../../assets/icons/calendar.png'),
  expiry:        require('../../assets/icons/expiry.png'),
  biometrics:    require('../../assets/icons/biometrics.png'),
  application:   require('../../assets/icons/application.png'),
  interview:     require('../../assets/icons/interview.png'),
};

interface AppIconProps {
  name: IconName;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 48, style }) => (
  React.createElement(Image, {
    source: ICON_MAP[name],
    style: [{ width: size, height: size }, style],
    resizeMode: 'contain',
  })
);
