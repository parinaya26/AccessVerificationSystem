const KEY = "labsecure_professional_v1";
const defaultData = {
  researchers: [
    {name:"Maya Chen", id:"R-104", zone:"Genomics", status:"Active"},
    {name:"Arjun Rao", id:"R-108", zone:"Wet Lab", status:"Active"},
    {name:"Elena Morris", id:"R-112", zone:"Storage", status:"Revoked"},
    {name:"Noah Williams", id:"R-116", zone:"Administration", status:"Active"}
  ],
  queue: [],
  history: [
    {kind:"success", title:"Access approved", detail:"Maya Chen · Genomics", time:Date.now()-1000*60*12},
    {kind:"neutral", title:"Researcher profile added", detail:"Noah Williams · R-116", time:Date.now()-1000*60*42},
    {kind:"denied", title:"Access denied", detail:"Elena Morris · Storage permission revoked", time:Date.now()-1000*60*95}
  ],
  approved: 1, lockdown:false
};
let data;
try { data = JSON.parse(localStorage.getItem(KEY)) || structuredClone(defaultData); } catch(e) { data = JSON.parse(JSON.stringify(defaultData)); }
let sortAscending = true;
let toastTimer;
const $ = id => document.getElementById(id);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e) {} };
const initials = name => name.split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase();
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const timeAgo = timestamp => { const mins=Math.max(0,Math.floor((Date.now()-timestamp)/60000)); if(mins<1)return "Just now"; if(mins<60)return `${mins} min ago`; const hours=Math.floor(mins/60); if(hours<24)return `${hours} hr ago`; return `${Math.floor(hours/24)} day ago`; };
function notify(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function log(kind,title,detail){data.history.unshift({kind,title,detail,time:Date.now()});data.history=data.history.slice(0,40);}
function render(){
  $("statResearchers").textContent=data.researchers.length;
  $("statPending").textContent=data.queue.length;
  $("statApproved").textContent=data.approved;
  $("statActions").textContent=data.history.length;
  $("navQueueCount").textContent=data.queue.length;
  $("requestBadge").textContent=`${data.queue.length} pending`;
  $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
  renderResearchers();renderQueue();renderHistory();renderResearcherOptions();
  $("lockdownBtn").textContent=data.lockdown?"Disable lockdown":"Enable lockdown";
  $("lockBanner").classList.toggle("hidden",!data.lockdown);
}
function renderResearchers(){
 const q=$("researcherSearch").value.trim().toLowerCase(), status=$("statusFilter").value;
 const list=data.researchers.filter(r=>(!q||`${r.name} ${r.id} ${r.zone}`.toLowerCase().includes(q))&&(status==="all"||r.status===status));
 $("researcherTable").innerHTML=list.length?list.map(r=>`<tr><td><div class="person-cell"><div class="person-avatar">${escapeHTML(initials(r.name))}</div><div><div class="person-name">${escapeHTML(r.name)}</div><div class="person-email">Research personnel</div></div></div></td><td><span class="id-tag">${escapeHTML(r.id)}</span></td><td>${escapeHTML(r.zone)}</td><td><span class="status ${r.status.toLowerCase()}">${r.status}</span></td><td><button class="row-action" title="${r.status==="Active"?"Revoke access":"Restore access"}" data-toggle="${escapeHTML(r.id)}">${r.status==="Active"?"•••":"↻"}</button></td></tr>`).join(""):`<tr><td colspan="5" style="text-align:center;padding:25px;color:#aaa7b6">No matching researchers found.</td></tr>`;
 $("directoryCount").textContent=`Showing ${list.length} of ${data.researchers.length} researchers`;
 document.querySelectorAll("[data-toggle]").forEach(btn=>btn.addEventListener("click",()=>toggleResearcher(btn.dataset.toggle)));
}
function renderQueue(){
 $("queueList").innerHTML=data.queue.length?data.queue.map((r,i)=>`<div class="queue-item"><div class="queue-number">${String(i+1).padStart(2,"0")}</div><div class="queue-person"><strong>${escapeHTML(r.name)}</strong><small>${escapeHTML(r.id)} · Requested ${escapeHTML(r.zone)}</small></div><span class="queue-area">Waiting</span></div>`).join(""):`<div class="queue-empty">You're all caught up. No requests waiting.</div>`;
}
function renderHistory(){
 $("activityList").innerHTML=data.history.length?data.history.slice(0,7).map(item=>`<div class="activity-item"><div class="activity-icon ${item.kind}">${item.kind==="success"?"✓":item.kind==="denied"?"×":"↗"}</div><div class="activity-copy"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.detail)}</p></div><span class="activity-time">${timeAgo(item.time)}</span></div>`).join(""):`<div class="queue-empty">No activity recorded yet.</div>`;
}
function renderResearcherOptions(){
 const active=data.researchers.filter(r=>r.status==="Active");
 $("requestResearcher").innerHTML=active.length?active.map(r=>`<option value="${escapeHTML(r.id)}">${escapeHTML(r.name)} (${escapeHTML(r.id)})</option>`).join(""):`<option value="">No active researchers</option>`;
}
function toggleResearcher(id){
 const r=data.researchers.find(x=>x.id===id);if(!r)return;
 r.status=r.status==="Active"?"Revoked":"Active";
 log("neutral",r.status==="Active"?"Access restored":"Access revoked",`${r.name} · ${r.id}`);
 save();render();notify(`${r.name}: access ${r.status.toLowerCase()}.`);
}
function openDialog(){ $("researcherDialog").showModal(); $("newName").focus(); }
function addResearcher(event){
 event.preventDefault();
 const name=$("newName").value.trim(), id=$("newId").value.trim().toUpperCase(), zone=$("newZone").value;
 if(!name||!id)return;
 if(data.researchers.some(r=>r.id.toLowerCase()===id.toLowerCase())){notify("That researcher ID already exists.");return;}
 data.researchers.push({name,id,zone,status:"Active"});
 log("neutral","Researcher profile added",`${name} · ${id}`);
 save();$("researcherForm").reset();$("researcherDialog").close();render();notify("Researcher added successfully.");
}
function submitRequest(event){
 event.preventDefault();const id=$("requestResearcher").value, zone=$("requestZone").value;
 const r=data.researchers.find(x=>x.id===id);
 if(!r){notify("Add an active researcher before submitting a request.");return;}
 data.queue.push({name:r.name,id:r.id,zone,requestedAt:Date.now()});save();render();notify("Access request added to the queue.");
}
function processNext(){
 if(!data.queue.length){notify("There are no requests to verify.");return;}
 const req=data.queue.shift(), researcher=data.researchers.find(r=>r.id===req.id);
 let approved=!data.lockdown && researcher && researcher.status==="Active" && researcher.zone===req.zone;
 if(approved){data.approved++;log("success","Access approved",`${req.name} · ${req.zone}`);notify(`Approved: ${req.name} may access ${req.zone}.`);}
 else {const reason=data.lockdown?"Emergency lockdown is active":!researcher||researcher.status!=="Active"?"Researcher access is inactive":`No permission for ${req.zone}`;log("denied","Access denied",`${req.name} · ${reason}`);notify(`Denied: ${reason}.`);}
 save();render();
}
function lookup(){
 const q=$("lookupInput").value.trim().toLowerCase(), out=$("lookupResult");
 if(!q){out.className="lookup-result";out.textContent="Enter a researcher name or ID to search.";return;}
 const exact=data.researchers.find(r=>r.id.toLowerCase()===q), match=exact||data.researchers.find(r=>r.name.toLowerCase().includes(q)||r.id.toLowerCase().includes(q));
 if(match){out.className="lookup-result found";out.innerHTML=`<strong>${escapeHTML(match.name)}</strong> · ${escapeHTML(match.id)}<br>Area: ${escapeHTML(match.zone)} · Status: ${escapeHTML(match.status)}`;}
 else{out.className="lookup-result not-found";out.textContent="No researcher matched your search.";}
}
function sortResearchers(){
 data.researchers.sort((a,b)=>sortAscending?a.id.localeCompare(b.id,undefined,{numeric:true}):b.id.localeCompare(a.id,undefined,{numeric:true}));
 sortAscending=!sortAscending;log("neutral","Directory sorted","Researcher records arranged by ID");save();render();notify("Directory sorted by researcher ID.");
}
$("quickAddBtn").addEventListener("click",openDialog);$("directoryAddBtn").addEventListener("click",openDialog);
$("closeDialog").addEventListener("click",()=>$("researcherDialog").close());$("cancelDialog").addEventListener("click",()=>$("researcherDialog").close());
$("researcherForm").addEventListener("submit",addResearcher);$("requestForm").addEventListener("submit",submitRequest);
$("researcherSearch").addEventListener("input",renderResearchers);$("statusFilter").addEventListener("change",renderResearchers);
$("processNextBtn").addEventListener("click",processNext);$("lookupBtn").addEventListener("click",lookup);$("lookupInput").addEventListener("keydown",e=>{if(e.key==="Enter")lookup();});$("sortBtn").addEventListener("click",sortResearchers);
$("lockdownBtn").addEventListener("click",()=>{data.lockdown=!data.lockdown;log("denied",data.lockdown?"Emergency lockdown enabled":"Emergency lockdown disabled",data.lockdown?"New access approvals are blocked":"Normal verification resumed");save();render();notify(data.lockdown?"Emergency lockdown enabled.":"Lockdown disabled.");});
$("clearActivityBtn").addEventListener("click",()=>{if(!data.history.length){notify("Activity history is already empty.");return;}data.history=[];save();render();notify("Activity history cleared.");});
document.querySelectorAll(".nav-link").forEach(link=>link.addEventListener("click",()=>{document.querySelectorAll(".nav-link").forEach(x=>x.classList.remove("active"));link.classList.add("active");}));
render();
