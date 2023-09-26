export const orderCreatedEvent = {
  eventId: 'bf29e98b-1ec2-4f11-b736-e1a1c8884365',
  event: 'ORDER_CREATED',
  payload: { id: 'c829e6dc-31fd-4efe-a3f0-9ea78f9b2260', version: 1 },
};

export const pickJobCreatedEvent = {
  eventId: '72e383f3-649a-4e8e-9b74-0bf0be8a92bf',
  event: 'PICK_JOB_CREATED',
  payload: { id: 'c829e6dc-31fd-4efe-a3f0-9ea78f9b2260', version: 1 },
};

export const pickJobFinishedEvent = {
  eventId: 'ebdbfe80-4e49-4ad6-a732-2d4a7f105596',
  event: 'PICK_JOB_PICKING_FINISHED',
  payload: { id: 'c829e6dc-31fd-4efe-a3f0-9ea78f9b2260', version: 1 },
};

export const handoverCreatedEvent = {
  eventId: 'adeea6f0-edef-437a-8b0f-7cebb1329bcc',
  event: 'HANDOVERJOB_CREATED',
  payload: {
    id: '7f4186ba-d630-4967-9898-36c6e455fad2',
    tenantOrderId: 'cdca0e33-1055-489d-bc9f-a09024aa1431',
    version: 1,
  },
};

export const handoverHandedOverEvent = {
  eventId: 'b65c859e-dfaa-4e40-a94c-fd288300d956',
  event: 'HANDOVERJOB_HANDED_OVER',
  payload: {
    id: '7f4186ba-d630-4967-9898-36c6e455fad2',
    tenantOrderId: 'cdca0e33-1055-489d-bc9f-a09024aa1431',
    version: 1,
  },
};
