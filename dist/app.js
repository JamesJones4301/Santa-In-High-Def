const form=document.getElementById('booking-form');
const dateInput=form.elements.date;
const now=new Date();const pad=n=>String(n).padStart(2,'0');
dateInput.min=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
document.getElementById('year').textContent=now.getFullYear();
document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>{form.elements.experience.value=a.dataset.service;}));
let request='';
form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;if(dateInput.value<dateInput.min){dateInput.setCustomValidity('Choose today or a future date.');dateInput.reportValidity();return;}const f=new FormData(form);request=`Hello Santa In High Def,\n\nI would like to request a Santa appearance.\n\nName: ${f.get('name')}\nEmail: ${f.get('email')}\nPhone: ${f.get('phone')}\nOrganization: ${f.get('company')||'Not specified'}\nEvent type: ${f.get('eventType')}\nExperience: ${f.get('experience')}\nPreferred date: ${f.get('date')}\nPreferred time: ${f.get('time')} (${f.get('timezone')})\nVisit length: ${f.get('duration')}\nEstimated guests: ${f.get('guests')}\nLocation: ${f.get('location')}\nChristmas music: ${f.get('music')}\n\nEvent details:\n${f.get('details')}\n\nPlease share availability, pricing, and next steps. I understand this request does not confirm a booking.\n\nThank you!`;
document.getElementById('request-text').textContent=request;document.getElementById('email-request').href=`mailto:3angleevents@gmail.com?cc=santainhd%40gmail.com&subject=${encodeURIComponent('Santa appearance request: '+f.get('date')+' - '+f.get('experience'))}&body=${encodeURIComponent(request)}`;const review=document.getElementById('review');review.hidden=false;document.getElementById('copy-request').textContent='Copy request';review.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});});
dateInput.addEventListener('input',()=>dateInput.setCustomValidity(''));
form.addEventListener('input',()=>{document.getElementById('review').hidden=true;});
document.getElementById('copy-request').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(request);e.target.textContent='Copied';}catch{const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(document.getElementById('request-text'));selection.removeAllRanges();selection.addRange(range);document.getElementById('send-status').textContent='Select and copy the highlighted request, then paste it into your email app.';}});

// One copy of each photo. Advance by scrolling the gallery items.
const track=document.getElementById('stops-track');
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
let slideshowRunning=!motionPreference.matches;
let pointerOverGallery=false;
let galleryHasFocus=false;
const pauseButton=document.getElementById('stops-pause');
function updateSlideshowButton(){pauseButton.textContent=slideshowRunning?'Pause slideshow':'Play slideshow';}
function moveGallery(direction){const first=track.querySelector('.stop-photo');const step=first.getBoundingClientRect().width+24;const max=track.scrollWidth-track.clientWidth;let next=track.scrollLeft+direction*step;if(next>max+5)next=0;if(next<0)next=max;track.scrollTo({left:Math.max(0,Math.min(max,next)),behavior:motionPreference.matches?'auto':'smooth'});}
document.getElementById('stops-prev').addEventListener('click',()=>{slideshowRunning=false;updateSlideshowButton();moveGallery(-1);});
document.getElementById('stops-next').addEventListener('click',()=>{slideshowRunning=false;updateSlideshowButton();moveGallery(1);});
pauseButton.addEventListener('click',()=>{slideshowRunning=!slideshowRunning;updateSlideshowButton();});
track.addEventListener('mouseenter',()=>{pointerOverGallery=true;});
track.addEventListener('mouseleave',()=>{pointerOverGallery=false;});
track.addEventListener('focusin',()=>{galleryHasFocus=true;});
track.addEventListener('focusout',()=>{galleryHasFocus=false;});
track.addEventListener('pointerdown',()=>{slideshowRunning=false;updateSlideshowButton();});
track.addEventListener('wheel',()=>{slideshowRunning=false;updateSlideshowButton();},{passive:true});
track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();slideshowRunning=false;updateSlideshowButton();moveGallery(e.key==='ArrowRight'?1:-1);}});
setInterval(()=>{if(!slideshowRunning||pointerOverGallery||galleryHasFocus||document.hidden)return;const bounds=track.getBoundingClientRect();if(bounds.top<window.innerHeight&&bounds.bottom>0)moveGallery(1);},5000);
motionPreference.addEventListener('change',()=>{if(motionPreference.matches){slideshowRunning=false;updateSlideshowButton();}});
updateSlideshowButton();
