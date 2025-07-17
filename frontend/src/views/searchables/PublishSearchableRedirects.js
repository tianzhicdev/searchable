import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import PublishAllInOneSearchable from './PublishAllInOneSearchable';

// These components redirect old routes to PublishAllInOneSearchable with preset configurations

export const PublishDownloadableRedirect = () => {
  const history = useHistory();
  
  // Create an allinone searchable with only downloadable enabled
  const presetSearchable = {
    payloads: {
      public: {
        type: 'allinone',
        components: {
          downloadable: { enabled: true, files: [] },
          offline: { enabled: false, items: [] },
          donation: { enabled: false, pricingMode: 'flexible' }
        }
      }
    }
  };
  
  return <PublishAllInOneSearchable initialPreset="downloadable" />;
};

export const PublishOfflineRedirect = () => {
  const history = useHistory();
  
  // Create an allinone searchable with only offline enabled
  const presetSearchable = {
    payloads: {
      public: {
        type: 'allinone',
        components: {
          downloadable: { enabled: false, files: [] },
          offline: { enabled: true, items: [] },
          donation: { enabled: false, pricingMode: 'flexible' }
        }
      }
    }
  };
  
  return <PublishAllInOneSearchable initialPreset="offline" />;
};

export const PublishDirectRedirect = () => {
  const history = useHistory();
  
  // Create an allinone searchable with only donation enabled
  const presetSearchable = {
    payloads: {
      public: {
        type: 'allinone',
        components: {
          downloadable: { enabled: false, files: [] },
          offline: { enabled: false, items: [] },
          donation: { enabled: true, pricingMode: 'flexible' }
        }
      }
    }
  };
  
  return <PublishAllInOneSearchable initialPreset="donation" />;
};