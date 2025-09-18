const REGRET_KEY = 'eunoia_regrets_v2';

    // --- App boot ---
    function enterApp(){
      document.getElementById('splash').style.display='none';
      document.getElementById('app').classList.remove('hidden');
      openTab('post');
      initApp();
      initMap();
    }

    function openAboutModal(){ document.getElementById('aboutModal').style.display='flex'; }
    function closeAboutModal(){ document.getElementById('aboutModal').style.display='none'; }

    function openTab(id){
      document.querySelectorAll('.tab').forEach(t=>t.classList.add('hidden'));
      document.getElementById(id).classList.remove('hidden');
      // nav highlight
      document.querySelectorAll('header nav button').forEach(b=>b.classList.remove('bg-white/5'));
      const mapButtons = {post:'nav-post', explore:'nav-explore', euno:'nav-chat', maps:'nav-map'};
      Object.values(mapButtons).forEach(id=>document.getElementById(id)?.classList.add('bg-white/5'));

      // clear Euno chat on leaving
      if(id!=='euno') { clearChat(); }
      // set active nav
      document.querySelectorAll('header nav button').forEach(btn=>btn.classList.remove('active'));
    }

    // --- Regrets: storage, post, load ---
    function initApp(){
      if(!localStorage.getItem(REGRET_KEY)){
        const seed = [
          {id:Date.now()-60000, text:'I wish I had told them I loved them sooner.', date:new Date(Date.now()-60000).toLocaleString(), likes:3, comments:[{text:'Same',date:new Date().toLocaleString()}]},
          {id:Date.now()-120000, text:'I regret not pursuing that one small dream.', date:new Date(Date.now()-120000).toLocaleString(), likes:5, comments:[]}
        ];
        localStorage.setItem(REGRET_KEY, JSON.stringify(seed));
      }
      renderMyDrafts(); renderExplore();
    }

    function postRegret(){
      const ta = document.getElementById('regretInput'); const text = ta.value.trim();
      if(!text) return alert('Write something to post.');
      const list = JSON.parse(localStorage.getItem(REGRET_KEY)||'[]');
      const entry = { id: Date.now(), text, date: new Date().toLocaleString(), likes:0, comments:[] };
      list.unshift(entry); localStorage.setItem(REGRET_KEY, JSON.stringify(list));
      ta.value=''; renderMyDrafts(); renderExplore();
      toast('Posted anonymously');
    }

    function clearDraft(){ document.getElementById('regretInput').value=''; }
    function preloadExamples(){ document.getElementById('regretInput').value='I regret choosing safety over curiosity.' }

    function renderMyDrafts(){
      const list = JSON.parse(localStorage.getItem(REGRET_KEY)||'[]');
      const container = document.getElementById('myDrafts');
      container.innerHTML = list.slice(0,5).map(r=>`<div class="p-3 rounded-xl glass"><div class="text-sm muted">${r.date} • Anonymous</div><div class="mt-2">${escapeHTML(r.text)}</div></div>`).join('');
    }

    function renderExplore(){
      const list = JSON.parse(localStorage.getItem(REGRET_KEY)||'[]');
      const container = document.getElementById('exploreList');
      if(!list.length){ container.innerHTML = '<div class="muted">No regrets yet — be the first to share.</div>'; return; }
      container.innerHTML = list.map(r=> renderCard(r)).join('');
    }

    function renderCard(r){
      const comments = (r.comments||[]).map(c=>`<div class="text-sm muted mt-2 p-2 rounded-md bg-[#061021]">${escapeHTML(c.text)}<div class=\"text-xs muted mt-1\">${escapeHTML(c.date)} • Anonymous</div></div>`).join('');
      return `<div class=\"glass p-4 rounded-2xl\">\
        <div class=\"flex items-start justify-between\">\
          <div>\
            <div class=\"text-sm muted\">${escapeHTML(r.date)} • Anonymous</div>\
            <div class=\"mt-2\">${escapeHTML(r.text)}</div>\
          </div>\
          <div class=\"flex flex-col items-end gap-2\">\
            <button onclick=\"toggleLike(${r.id})\" class=\"px-3 py-2 rounded-full bg-white/5\">❤️ ${r.likes||0}</button>\
            <button onclick=\"deleteRegret(${r.id})\" class=\"text-red-400 text-sm\">Delete</button>\
          </div>\
        </div>\
        <div id=\"comments-${r.id}\" class=\"mt-3\">${comments}</div>\
        <div class=\"mt-3 flex gap-2\">\
          <input id=\"commentInput-${r.id}\" class=\"flex-1 rounded-xl p-3 text-gray-900\" placeholder=\"Add anonymous comment...\"/>\
          <button onclick=\"addComment(${r.id})\" class=\"px-4 py-2 rounded-xl bg-white/5\">Comment</button>\
        </div>\
      </div>`;
    }

    function toggleLike(id){
      const list = JSON.parse(localStorage.getItem(REGRET_KEY)||'[]');
      const idx = list.findIndex(x=>x.id===id); if(idx===-1) return;
      list[idx].likes = (list[idx].likes||0)+1; localStorage.setItem(REGRET_KEY, JSON.stringify(list)); renderExplore(); toast('You liked a regret');
    }

    function addComment(id){
      const input = document.getElementById(`commentInput-${id}`);
      const txt = input?.value.trim(); if(!txt) return;
      const list = JSON.parse(localStorage.getItem(REGRET_KEY)||'[]'); const r = list.find(x=>x.id===id); if(!r) return;
      r.comments = r.comments||[]; r.comments.push({ text: txt, date: new Date().toLocaleString() }); localStorage.setItem(REGRET_KEY, JSON.stringify(list)); input.value=''; renderExplore(); toast('Comment added');
    }

    function deleteRegret(id){ if(!confirm('Delete this regret locally?')) return; const list = JSON.parse(localStorage.getItem(REGRET_KEY)||'[]').filter(x=>x.id!==id); localStorage.setItem(REGRET_KEY, JSON.stringify(list)); renderMyDrafts(); renderExplore(); }

    // --- Simple toasts ---
    function toast(msg){ const el = document.createElement('div'); el.className='fixed right-6 bottom-6 bg-white/5 p-3 rounded-lg shadow-lg'; el.innerText=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),1800); }

    // --- Euno: lightweight, local replies; clear on leave ---
    function clearChat(){ document.getElementById('chatWindow').innerHTML=''; }
    function sendMessage(){ const inpt=document.getElementById('chatInput'); const txt=inpt.value.trim(); if(!txt) return; appendChat('You', txt); inpt.value=''; setTimeout(()=> appendChat('Euno', eunoReply(txt)), 500); }
    function appendChat(sender, text){ const win = document.getElementById('chatWindow'); const el = document.createElement('div'); el.className='mb-2'; el.innerHTML = `<div class=\"text-sm muted\">${escapeHTML(sender)}</div><div class=\"p-3 mt-1 rounded-lg bg-[#061026]\">${escapeHTML(text)}</div>`; win.appendChild(el); win.scrollTop = win.scrollHeight; }
    function eunoReply(raw){ const t = raw.toLowerCase(); if(/(suicid|kill myself|end my life|self harm)/.test(t)) return "I’m sorry you’re feeling that way — please reach out to local emergency services or a trusted person immediately."; if(/(hi|hello|hey|namaste)/.test(t)) return "Hey — I’m Euno. How are you feeling today?"; if(/(sad|down|anxious|stressed|lonely|overwhelmed)/.test(t)) return "Thanks for sharing. That sounds heavy — do you want a breathing exercise or a small step to try right now?"; return ["I’m here to listen.","Tell me more about that.","What would help you right now?"].sort(()=>0.5-Math.random())[0]; }

    // --- Maps (Google Maps JS + Places) ---
    let map, placesService, geocoder;
    function initMap(){
      // map will initialize once Google maps script calls callback
      // we create an empty map centered on Andhra Pradesh
      const apCenter = { lat: 15.9129, lng: 79.7400 };
      map = new google.maps.Map(document.getElementById('map'), { center: apCenter, zoom: 7, disableDefaultUI: false });
      placesService = new google.maps.places.PlacesService(map);
      geocoder = new google.maps.Geocoder();

      // searchable on Enter in search box
      document.getElementById('mapSearch').addEventListener('keydown', (e)=>{ if(e.key==='Enter') searchMap(); });
      // render default nearby in AP
      searchNearby(apCenter);
    }

    function searchMap(){ const q = document.getElementById('mapSearch').value.trim(); if(!q) return searchNearby({lat:15.9129,lng:79.7400}); geocoder.geocode({address: q + ', Andhra Pradesh, India'}, (results,status)=>{ if(status==='OK' && results[0]){ const loc = results[0].geometry.location; map.setCenter(loc); map.setZoom(12); searchNearby({lat:loc.lat(), lng:loc.lng()}); } else { alert('Could not find that location. Try a nearby city name (eg: Vijayawada).'); } }); }

    function useMyLocation(){ if(!navigator.geolocation) return alert('Geolocation not supported'); navigator.geolocation.getCurrentPosition(pos=>{ const loc = {lat: pos.coords.latitude, lng: pos.coords.longitude}; map.setCenter(loc); map.setZoom(13); searchNearby(loc); }, err=>{ alert('Unable to fetch location — allow location permission and try again.'); }, { enableHighAccuracy: true, timeout:15000, maximumAge:0 }); }

    function searchNearby(loc){
      // clear markers & list
      document.getElementById('placesList').innerHTML='';
      const request = { location: new google.maps.LatLng(loc.lat, loc.lng), radius: 8000, keyword: 'hospital|psychiatrist|mental health', type: ['hospital','health'] };
      placesService.nearbySearch(request, (results, status)=>{
        if(status!==google.maps.places.PlacesServiceStatus.OK){ document.getElementById('placesList').innerHTML='<div class="muted">No places found nearby.</div>'; return; }
        results.slice(0,12).forEach(place=> renderPlace(place));
      });
    }

    function renderPlace(place){
      const list = document.getElementById('placesList');
      const el = document.createElement('div'); el.className='p-4 rounded-lg glass';
      el.innerHTML = `<div class=\"font-semibold\">${escapeHTML(place.name)}</div><div class=\"muted text-sm mt-1\">${escapeHTML(place.vicinity||'')}</div><div class=\"mt-2\">Rating: ${place.rating||'—'}</div>`;
      el.addEventListener('click', ()=>{ map.setCenter(place.geometry.location); map.setZoom(15); const inf = new google.maps.InfoWindow({content:`<strong>${place.name}</strong><div>${place.vicinity||''}</div>`}); inf.open(map); });
      list.appendChild(el);
      // place marker
      new google.maps.Marker({ map, position: place.geometry.location, title: place.name });
    }

    // --- utils ---
    function escapeHTML(s){ return String(s).replace(/[&<>'"`]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#x60;'}[c])); }
