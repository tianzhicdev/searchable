import React from 'react';
import { SvgIcon } from '@material-ui/core';

// Instagram Icon
export const InstagramIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
  </SvgIcon>
);

// X (Twitter) Icon
export const XIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </SvgIcon>
);

// YouTube Icon
export const YouTubeIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </SvgIcon>
);

// Helper function to get icon component by platform name
export const getSocialMediaIcon = (platform) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return InstagramIcon;
    case 'twitter':
    case 'x':
      return XIcon;
    case 'youtube':
      return YouTubeIcon;
    default:
      return null;
  }
};

// Social media platform configurations
export const SOCIAL_MEDIA_PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: InstagramIcon,
    baseUrl: 'https://instagram.com/',
    placeholder: 'username',
    color: '#E4405F'
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    icon: XIcon,
    baseUrl: 'https://x.com/',
    placeholder: 'username',
    color: '#000000'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: YouTubeIcon,
    baseUrl: 'https://youtube.com/@',
    placeholder: 'channelname',
    color: '#FF0000'
  }
];

// Helper function to validate social media URLs
export const validateSocialMediaUrl = (platform, value) => {
  if (!value) return true; // Empty is valid
  
  // Remove @ if present at the beginning
  const cleanValue = value.startsWith('@') ? value.substring(1) : value;
  
  // Basic validation - alphanumeric, underscore, dot
  const usernameRegex = /^[a-zA-Z0-9._]+$/;
  return usernameRegex.test(cleanValue);
};

// Helper function to format social media URL
export const formatSocialMediaUrl = (platform, username) => {
  if (!username) return '';
  
  // Remove @ if present
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  const platformConfig = SOCIAL_MEDIA_PLATFORMS.find(p => p.id === platform);
  if (!platformConfig) return '';
  
  return platformConfig.baseUrl + cleanUsername;
};