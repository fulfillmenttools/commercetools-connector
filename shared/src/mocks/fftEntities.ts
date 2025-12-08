export function mockFftOrder(initialValue = {}) {
  return {
    id: '12a763b6-7a6f-45ed-ab70-fe9fa2bd1307',
    version: 3,
    customAttributes: {
      commercetoolsId: '554867c5-d3be-4764-94c8-bdf1c78a5190',
    },
    shipmentRef: '124',
    ...initialValue,
  };
}

export function mockFftParcel(initialValue = {}) {
  return {
    "parcelRef": "019aca4e-1e2d-7197-87e2-ee8099c21df0",
    "status": "DONE",
    "carrierRef": "a4edb353-2345-4196-837c-bf45b7beff43",
    ...initialValue
  };
}

export function mockFftShipment(initialValue = {}) {
  return {
    "facilityRef": "64c0afef-e428-4279-af7d-0b44eb69ab75",
    "version": 1,
    "tenantOrderId": "2025-12-2-38049",
    "id": "019ade86-21c6-70f6-b91d-67a8a25d71b8",
    "orderDate": "2025-12-02T09:57:16.436Z",
    "targetTime": "2025-12-03T11:00:00.000Z",
    "lastModified": "2025-12-02T10:05:24.991Z",
    "created": "2025-12-02T10:05:24.991Z",
    "hasActiveCarrier": true,
    "sourceAddress": {
      "city": "Göttingen",
      "country": "DE",
      "postalCode": "37073",
      "street": "Kornmarkt",
      "companyName": "CHRIST - Göttingen - Kornmarkt",
      "houseNumber": "1",
      "resolvedTimeZone": {
        "offsetInSeconds": 3600,
          "timeZoneId": "Europe/Berlin",
          "timeZoneName": "W. Europe Standard Time"
      }
    },
    "targetAddress": {
      "firstName": "Maxi",
      "lastName": "Milian",
      "street": "Hauptstr",
      "houseNumber": "1",
      "postalCode": "22415",
      "city": "Hamburg",
      "country": "DE",
      "addressType": "POSTAL_ADDRESS",
      "email": "maxi.milian@test.de",
      "province": "DE-SH"
    },
    "invoiceAddress": {
      "firstName": "Maxi",
      "lastName": "Milian",
      "street": "Hauptstr",
      "houseNumber": "1",
      "postalCode": "22415",
      "city": "Hamburg",
      "country": "DE",
      "addressType": "POSTAL_ADDRESS",
      "email": "maxi.milian@test.de",
      "province": "DE-SH"
    },
    "postalAddress": {
      "firstName": "Maxi",
      "lastName": "Milian",
      "street": "Hauptstr",
      "houseNumber": "1",
      "postalCode": "22415",
      "city": "Hamburg",
      "country": "DE",
      "addressType": "POSTAL_ADDRESS",
      "email": "maxi.milian@test.de",
      "province": "DE-SH"
    },
    "status": "INITIAL",
    "lineItems": [
      {
        "id": "019ade86-2677-73f8-b5a7-460629010eb3",
        "article": {
          "tenantArticleId": "87774317",
          "title": "CHRIST Damenring 87774317",
          "imageUrl": "https://assets.chrimg.com/image/christ/40001036/40001036/product_md_extend02/40001036.jpg",
          "attributes": [
            {
              "key": "Warengruppe",
              "value": "Ringe",
              "type": "STRING",
              "category": "descriptive",
              "priority": 400
            },
            {
              "key": "Hersteller",
              "value": "CHRIST",
              "type": "STRING",
              "category": "descriptive",
              "priority": 400
            },
            {
              "key": "Farbe",
              "value": "silber",
              "type": "STRING",
              "category": "descriptive",
              "priority": 400
            }
          ],
          "prices": [
            {
              "pricePerUnit": 5.99,
              "currency": "EUR"
            }
          ]
        },
        "quantity": 1,
        "measurementUnitKey": null,
        "scannableCodes": [
          "87774317"
        ],
        "customAttributes": {
          "commercetoolsId": "92c31b0a-3212-4a7d-ab2b-c6d1a78a297b"
        },
        "tags": [],
        "recordableAttributes": null
      }
    ],
    "paymentInformation": {
      "currency": "EUR"
    },
    "customAttributes": {
      "commercetoolsId": "a26406a4-98fc-4dde-a8ca-c1e094084a1f"
    },
    "carrierKey": "DHL_V2",
    "carrierRef": "a4edb353-2345-4196-837c-bf45b7beff43",
    "_order": "2533711003360957",
    "operativeProcessRef": "019ade86-21a6-7631-94b3-5b34a3492798",
    "parcels": [
      {
        "carrierRef": "a4edb353-2345-4196-837c-bf45b7beff43",
        "carrierTrackingNumber": "00340434465095014217",
        "parcelRef": "019aca4e-1e2d-7197-87e2-ee8099c21df0",
        "status": "DONE"
      }
    ],
    ...initialValue,
  };
}
