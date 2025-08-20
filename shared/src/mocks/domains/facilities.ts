import { http, HttpResponse } from 'msw';

import { fftApi } from '../baseUrls';
import {
  Facility,
  FacilityStatus,
  StrippedFacilities,
  StrippedFacility,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

const facilityCologne: StrippedFacility = {
  city: 'Köln',
  country: 'DE',
  houseNumber: '20',
  id: 'store_cologne_fft_id',
  postalCode: '51063',
  status: FacilityStatus.ONLINE,
  street: 'Schanzenstraße',
  version: 1,
  tenantFacilityId: 'store_cologne',
};
const facilityHamburg: StrippedFacility = {
  city: 'Hamburg',
  country: 'DE',
  houseNumber: '2',
  id: 'store_hamburg_fft_id',
  postalCode: '20457',
  status: FacilityStatus.ONLINE,
  street: 'Kehrwieder',
  version: 1,
  tenantFacilityId: 'store_hamburg',
};
const facilityMunich: StrippedFacility = {
  city: 'München',
  country: 'DE',
  houseNumber: '2',
  id: 'store_munich_fft_id',
  postalCode: '20457',
  status: FacilityStatus.ONLINE,
  street: 'Kehrwieder',
  version: 1,
  tenantFacilityId: 'store_munich',
};

const fullFacilityCologne: Facility = {
  address: {
    city: 'Köln',
    country: 'DE',
    houseNumber: '20',
    postalCode: '51063',
    street: 'Schanzenstraße',
    companyName: 'fulfullmenttools',
  },
  id: 'store_cologne_fft_id',
  status: FacilityStatus.ONLINE,
  version: 1,
  tenantFacilityId: 'store_cologne',
  name: 'fulfullmenttools',
};

const facilities: StrippedFacility[] = [facilityCologne, facilityHamburg, facilityMunich];
const fullFacilities = [fullFacilityCologne];

export const handlers = [
  http.get(fftApi('/facilities'), ({ request }) => {
    let strippedFacilities: StrippedFacility[] = facilities;
    const url = new URL(request.url);
    const tenantFacilityId = url.searchParams.get('tenantFacilityId');
    if (tenantFacilityId) {
      strippedFacilities = facilities.filter((f) => f.tenantFacilityId === tenantFacilityId);
    }
    const result: StrippedFacilities = { facilities: strippedFacilities, total: strippedFacilities.length };
    return HttpResponse.json(result);
  }),

  http.get(fftApi('/facilities/:facilityId'), ({ params }) => {
    const { facilityId } = params;
    const facility = fullFacilities.find((f) => f.id === facilityId);

    if (!facility) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return HttpResponse.json(facility);
  }),

  http.patch(fftApi('/facilities/:facilityId'), ({ params }) => {
    const { facilityId } = params;
    const facility = fullFacilities.find((f) => f.id === facilityId);

    if (!facility) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return HttpResponse.json(facility);
  }),
];
