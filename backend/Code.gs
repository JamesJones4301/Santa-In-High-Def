// Paste this file into Extensions > Apps Script in the booking spreadsheet.
function setupBookingBackend() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book.getSheetByName('Bookings')) throw new Error('Bookings tab missing');
  MailApp.getRemainingDailyQuota();
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('BOOKING_SHEET_ID',book.getId());
  let secret = properties.getProperty('BOOKING_SHARED_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('BOOKING_SHARED_SECRET',secret);
  }
  SpreadsheetApp.getUi().alert('Private Vercel setting','Add BOOKING_SHARED_SECRET as a Production secret environment variable in Vercel. Copy this value directly into Vercel. Do not paste it into chat or GitHub.\n\n'+secret,SpreadsheetApp.getUi().ButtonSet.OK);
}
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('BOOKING_SHARED_SECRET');
    if (!secret || payload.token !== secret) return jsonResponse_({ok:false});
    const book = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('BOOKING_SHEET_ID'));
    const sheet = book.getSheetByName('Bookings');
    if (payload.action === 'health') return jsonResponse_({ok:Boolean(sheet)});
    if (payload.action !== 'book') return jsonResponse_({ok:false});
    if (!/^[0-9a-f-]{36}$/i.test(payload.requestId || '')) return jsonResponse_({ok:false});
    const d = payload.data;
    const required=['name','email','phone','eventType','experience','date','time','timezone','duration','guests','location','music','details'];
    if (!d || required.some(key=>typeof d[key]!=='string' || !d[key].trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return jsonResponse_({ok:false});
    const lock=LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      const last=sheet.getLastRow();
      const prior=last>1?sheet.getRange(2,1,last-1,1).createTextFinder(payload.requestId).matchEntireCell(true).findNext():null;
      let row;
      if (prior) row=prior.getRow();
      else {
        // Escape spreadsheet formula prefixes in untrusted text.
        const safe=value=>/^[=+@-]/.test(String(value))?"'"+value:String(value || '');
        sheet.appendRow([payload.requestId,new Date(),safe(d.name),safe(d.email),safe(d.phone),safe(d.company),d.eventType,d.experience,d.date,d.time,d.timezone,d.duration,Number(d.guests),safe(d.location),d.music,safe(d.details),'New','', '', '', 'Pending','Pending']);
        row=sheet.getLastRow();
      }
      // Failed notifications remain visible in the sheet. A retry with the same ID retries only failed mail.
      if (sheet.getRange(row,22).getValue() !== 'Sent') {
        try {
          const settings=book.getSheetByName('Settings');
          const map={};settings.getRange(2,1,settings.getLastRow()-1,2).getValues().forEach(r=>map[r[0]]=r[1]);
          const body=['Santa appearance request','Request ID: '+payload.requestId,'Requester: '+d.name,'Email: '+d.email,'Phone: '+d.phone,'Organization: '+(d.company||'Not specified'),'Event type: '+d.eventType,'Experience: '+d.experience,'Date: '+d.date,'Time: '+d.time+' ('+d.timezone+')','Visit length: '+d.duration,'Guests: '+d.guests,'Location: '+d.location,'Christmas music: '+d.music,'','Details:',d.details,'','Review the request and update its Status in the booking sheet:',book.getUrl()].join('\n');
          MailApp.sendEmail({to:String(map['Approval email'] || '3angleevents@gmail.com'),cc:String(map['Santa notification email'] || 'santainhd@gmail.com'),replyTo:d.email,name:'Santa In High Def',subject:'Santa booking request: '+d.date,body});
          sheet.getRange(row,22).setValue('Sent');
        } catch (mailError) {sheet.getRange(row,22).setValue('Failed');}
      }
      // A request is accepted only after the row is durably stored. It is not a confirmed booking.
      return jsonResponse_({ok:true,requestId:payload.requestId});
    } finally {lock.releaseLock();}
  } catch (error) {return jsonResponse_({ok:false});}
}
function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
