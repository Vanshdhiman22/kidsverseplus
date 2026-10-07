from pathlib import Path
import json, re, textwrap
from collections import Counter
from datetime import datetime, timezone, timedelta
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, Preformatted, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'docs/api-audit'
OUT=ROOT/'output/pdf/Kidsverse_Full_62_Screen_Live_API_Audit.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
report=json.loads((DATA/'report.json').read_text(encoding='utf-8'))
screens=json.loads((DATA/'screens.json').read_text(encoding='utf-8'))
scan=json.loads((DATA/'browser-scan.json').read_text(encoding='utf-8'))
fonts=Path('C:/Windows/Fonts')
for name,file in [('UI','segoeui.ttf'),('UIBold','segoeuib.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(fonts/file)))
NAVY=colors.HexColor('#15233F'); INK=colors.HexColor('#263851'); MUTED=colors.HexColor('#61748A')
BLUE=colors.HexColor('#365FD1'); LINE=colors.HexColor('#D6DFEB'); LIGHT=colors.HexColor('#F0F4F9')
W,H=A4; M=40; CW=W-2*M
styles={
 'title':ParagraphStyle('Title',fontName='UIBold',fontSize=32,leading=38,textColor=NAVY,spaceAfter=16),
 'h1':ParagraphStyle('H1',fontName='UIBold',fontSize=21,leading=26,textColor=NAVY,spaceAfter=12),
 'h2':ParagraphStyle('H2',fontName='UIBold',fontSize=12,leading=16,textColor=BLUE,spaceBefore=12,spaceAfter=6,keepWithNext=True),
 'body':ParagraphStyle('Body',fontName='UI',fontSize=9.5,leading=14,textColor=INK,spaceAfter=6),
 'small':ParagraphStyle('Small',fontName='UI',fontSize=8,leading=11,textColor=MUTED,spaceAfter=5),
 'cell':ParagraphStyle('Cell',fontName='UI',fontSize=8,leading=11,textColor=INK),
 'code':ParagraphStyle('Code',fontName='Mono',fontSize=7.5,leading=10,textColor=INK,spaceAfter=8),
}
def clean(s):
    return str(s).replace('\u2011','-').replace('\u2013','-').replace('\u2014',' - ').replace('≠','!=').replace('→','->').replace('…','...').replace('“','"').replace('”','"').replace('’',"'").replace('\u00a0',' ')
def p(s,style='body',raw=False):return Paragraph(clean(s) if raw else escape(clean(s)),styles[style])
def heading(label,key):
    q=p(f'<a name="{key}"/>{escape(label)}','h1',True);q.bookmark=key;q.outline=label;return q
def image(path,width=CW,height=240):
    im=PILImage.open(path);w,h=im.size;scale=min(width/w,height/h)
    return Image(str(path),width=w*scale,height=h*scale,hAlign='CENTER')
def table(rows,widths,header=True):
    t=Table([[p(c,'cell',True) for c in row]for row in rows],colWidths=widths,repeatRows=1 if header else 0,hAlign='LEFT')
    spec=[('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LINEBELOW',(0,0),(-1,-1),.4,LINE)]
    if header:spec += [('BACKGROUND',(0,0),(-1,0),LIGHT)]
    t.setStyle(TableStyle(spec));return t
def status(s):
    if s['id']==1:return 'No API required'
    rs=[r for r in report['requests'] if s['id'] in r['screens']]
    findings=[f for f in report['findings'] if s['id'] in f['screens']]
    if not rs:return 'Blocked'
    if any(not r.get('ok') and not r.get('expected') for r in rs):return 'Mixed' if any(r.get('ok') for r in rs) else 'Failed'
    if findings or s['documentStatus']=='Partial':return 'Partial'
    return 'Responded'
def rawjson(value):
    text=value if isinstance(value,str) else json.dumps(value,indent=2,ensure_ascii=True)
    lines=[]
    for line in clean(text).splitlines():
        lines.extend(textwrap.wrap(line,width=108,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False) or [''])
    return Preformatted('\n'.join(lines),styles['code'])
class Doc(SimpleDocTemplate):
    def afterFlowable(self,flow):
        if hasattr(flow,'bookmark'):
            self.canv.bookmarkPage(flow.bookmark)
            self.canv.addOutlineEntry(flow.outline,flow.bookmark,level=0,closed=True)
            self.section=flow.outline
def chrome(c,d):
    c.saveState();c.setStrokeColor(LINE);c.line(M,H-29,W-M,H-29)
    c.setFont('UI',8);c.setFillColor(MUTED);c.drawString(M,H-22,'KIDSVERSE+  /  LIVE API & FRONTEND AUDIT')
    c.line(M,31,W-M,31);c.setFont('UI',7);c.drawString(M,20,'01 October 2026 | Recorded deployment snapshot | Credentials redacted')
    c.drawRightString(W-M,20,f'Page {d.page}');c.restoreState()
story=[]
story += [Spacer(1,40),p('ENGINEERING REVIEW / 01 OCTOBER 2026','small'),p('Kidsverse+\nFull API & Frontend Audit','title'),p('All 62 original screen entries','h1'),p('Live responses. Screen references. Missing contracts. Reproduced frontend defects.'),Spacer(1,16)]
counts=Counter(status(s) for s in screens)
request_counts=Counter(str(r.get('status')) for r in report['requests'])
story += [table([['Coverage','Recorded evidence'],['62 / 62 entries','Route observations saved; all original screen screenshots included.'],[f"{len(report['requests'])} selected requests",f"{sum(bool(r.get('ok')) for r in report['requests'])} successful 2xx; {sum(not r.get('ok') for r in report['requests'])} non-2xx failures, including {sum(bool(r.get('expected')) for r in report['requests'])} expected setup/auth checks."],['155 route-level captures','Latest browser observations; overlap with selected requests. Do not add these to the 95 as a unique total.'],['Overall conclusion','The full 62-screen experience is not ready to certify as working.']], [150,CW-150]),Spacer(1,18),p('Confirmed deployment','h2'),p(report['base']),p('Prepared from the saved live audit and supplied API PDFs. This PDF packages existing evidence; it does not run a new backend test. Original PDF images are design/reference screenshots, not proof that a live flow passed.'),p('Quick navigation','h2'),p('<link href="#summary" color="#365FD1">Summary & priorities</link>  |  <link href="#index" color="#365FD1">62-screen index</link>  |  <link href="#live-proof" color="#365FD1">Live screenshots</link>  |  <link href="#requests" color="#365FD1">Full request/response appendix</link>','body',True),PageBreak()]
story += [heading('Summary & priorities','summary'),p('Status definitions','h2'),table([
 ['Status','Meaning','Entries'],
 ['Responded','Relevant captured API calls returned 2xx. Full UI behavior is not certified.',str(counts['Responded'])],
 ['Partial','A related API responds, but required content, schema or frontend mapping is incomplete.',str(counts['Partial'])],
 ['Mixed','Both successful and unexpected failed responses exist for the entry.',str(counts['Mixed'])],
 ['Failed','The tested feature URLs failed; this does not prove unreleased backend code is absent.',str(counts['Failed'])],
 ['Blocked','No real dependent subject/topic/mission request could be completed.',str(counts['Blocked'])],
 ['No API required','The Landing screen requires no API.',str(counts['No API required'])],
],[78,CW-126,48]),p('Partial example: Screen 27','h2'),p('GET /missions/{id} returns 200, but content contains only an interactive_lesson and a steps string list. learn_before_test and check_for_understanding are absent. The frontend then displays "Lesson unavailable". HTTP success is not functional success.'),p('Most urgent blockers','h2')]
for t in [
 'P1 | Test result failure: the correct option ID was accepted and completion succeeded, but GET result returned HTML 500 twice for the same owned attempt. The wrong-answer attempt returned 200.',
 'P1 | Learning content: all four inspected Maths missions lack CFU. Literacy has no mission nodes, Computer no topics, and EVS/General are absent from the catalog.',
 'P1 | Incorrect presentation: a fractions test displays an Addition title and a 3 + 4 visual. EVS journey returns Computer and the UI mixes this with local plant/animal stations.',
 'P1 | Unavailable feature routes: reset, OTP, settings, chat, reviews, leaderboard, break passes, PIN, evidence and weekly plan probes returned 404.',
 'P1 | False reset confirmation and ineffective sign out: source inspection shows no reset request; Sign out only navigates and does not clear the auth session.',
 'P1 | Content release mismatch: curriculum/tree, curriculums, themes, package listing and the empty-body feed probe returned 404.',
]:story.append(p(t))
story += [PageBreak(),heading('Scope, evidence and next actions','scope'),p('What was exercised','h2'),p('One synthetic parent and one API Audit Child (CBSE Grade 4) were created. Tests covered login, onboarding saves, catalogs, mission start/completion with score 0, test attempts/answers/completion, battle start/completion with score 0, companion completion, and profile/parent reads. The backend awarded XP on synthetic completions. No real accounts were deleted/reset and no authored content was uploaded.'),p('What remains unverified','h2'),p('No real OTP delivery, email reset, audio scoring, full battle-question delivery or valid content-admin upload was exercised. Empty-body probes test route availability only. Several result/review screens require an earlier valid browser run; direct visits redirected. Route scans do not validate every control, role, accessibility, device, performance, or security case.'),p('Evidence sources','h2')]
for t in ['Kidsverse_All_Screens_API_62.pdf: screen numbers match physical PDF pages 01-62; all embedded screenshots are reproduced as references.','Kidsverse_API_Documentation.pdf: core contracts; physical-page citations appear on each screen entry.','kidsverse-content-api-reference.pdf: curriculum/content contract and ingestion paths.','Saved report.json: 95 selected HTTP captures with request/response bodies. browser-scan.json: latest route observations. browser-interactions.json: initial login and test reproduction.','Source inspection: identifies local fallbacks, reset/sign-out implementation, cached family state, and partial API data binding.','Local checks: 21 integration tests passed; production build passed. These checks do not certify the live deployment.']:story.append(p(t))
story += [p('Actions for the backend team','h2'),p('1. Fix the successful-test result 500 and provide the released response contract.\n2. Deploy the intended content routes and seed complete authored content for each subject.\n3. Confirm or implement the proposed missing feature routes.\n4. Fix unsupported subject fallback and clarify score/XP/progress roll-up rules.\n5. Supply an OTP test workflow and the content-admin authorization contract.'),p('Actions for the frontend team','h2'),p('1. Remove misleading local success/fallback states when live prerequisites fail.\n2. Bind test title, duration and visual to the actual selected test/question.\n3. Implement real reset and sign-out flows.\n4. Align subject/topic availability and parent/extra-learning views with returned data.\n5. Re-run affected flows after backend fixes.'),p('How to read the appendix','h2'),p('Request numbers are stable references to saved evidence. Payloads are preserved with secret values redacted. A null request body means no body was captured; a null 204 response means no content is expected. Long JSON lines are visually wrapped only. Timestamp strings in the appendix are the original recorded values.'),PageBreak(),heading('62-screen index','index')]
rows=[['No. / Screen','Conclusion']]
for s in screens:rows.append([f'<link href="#screen-{s["id"]}" color="#365FD1">{s["id"]:02d}  {escape(s["name"])}</link>',status(s)])
story += [table(rows,[CW-105,105]),PageBreak(),heading('Live browser evidence','live-proof'),p('These screenshots were captured from the running localhost app during the audit. Any original PDF image visible inside the audit viewer is labeled "reference" and is not a live result screenshot.')]
proofs=[('live-api-audit-side-by-side.png','Screen 27: actual Lesson unavailable state beside the 200 mission response.'),('live-test-mapping-issue.png','Screen 42: fractions question with an Addition title and unrelated counting visual.'),('live-result-500.png','Screen 44: saved frontend HTTP 500 response expanded beside the original result-screen reference.'),('live-evs-wrong-subject.png','Screen 20: EVS selected; live response changes the heading to Computer World while local stations remain.')]
for i,(f,caption) in enumerate(proofs):
    if i:story.append(PageBreak())
    story += [p(caption,'h2'),image(ROOT/'docs/verification'/f,height=420),Spacer(1,10),p('Captured test evidence. The audit viewer is local development tooling; its developer controls are not part of the child-facing production flow.','small')]
story.append(PageBreak())
for s in screens:
    sid=s['id'];rs=[r for r in report['requests'] if sid in r['screens']];obs=scan.get(str(sid),{})
    findings=[f['text'] for f in report['findings'] if sid in f['screens']]
    story += [heading(f'SCREEN {sid:02d}  {s["name"]}',f'screen-{sid}'),p(f'CONCLUSION: {status(s).upper()}','h2'),image(DATA/'screens'/f'screen-{sid:02d}.png',height=215),p(f'Original screen PDF, page {sid}. Reference screenshot - not live pass evidence.','small'),p(f'Frontend route: {s["route"]}','small'),p(f'Document coverage: {s["documentStatus"]}. Source: {s["evidence"]}.','small'),p('Live findings','h2')]
    if not findings:findings=['The mapped HTTP calls responded successfully. This is not full UI-flow certification; refer to browser observations and payloads below.']
    for f in findings:story.append(p('- '+f))
    story += [p('Browser observation','h2'),p(s['viewNote']),p(f'Observed route: {obs.get("route","No route captured")}. Captured calls: {len(obs.get("requests",[]))}.','small')]
    if obs.get('headings'):story.append(p('Visible headings: '+' | '.join(clean(h) for h in obs['headings']),'small'))
    if 'Lesson unavailable' in obs.get('text',''):story.append(p('Observed error: Lesson unavailable. The frontend could not load the lesson.'))
    if obs.get('route') and obs['route'].split('?')[0]!=s['route'].split('?')[0]:story.append(p('The observed path differs from the requested entry. A redirect or subsequent interaction occurred; this is not a successful rendering assertion for the original result/modal state.','small'))
    story += [p('Selected request/response evidence','h2')]
    if rs:
        rr=[['Capture','Request','HTTP']]
        for r in rs:rr.append([f'<link href="#request-{r["id"]}" color="#365FD1">#{r["id"]} - full payload</link>',escape(r['method']+' '+r['path']),escape(str(r['status'])+(' expected' if r.get('expected') else ''))])
        story.append(table(rr,[87,CW-138,51]))
    else:story.append(p('No selected HTTP capture for this entry. The dependency or availability limitation is recorded above. No successful response has been invented.'))
    if obs.get('requests'):
        story += [p('Latest browser route traffic','h2'),table([['Method / path','Status'],*[[escape(r['method']+' '+r['path']),escape(str(r['status']))] for r in reversed(obs['requests'])]],[CW-55,55])]
    story.append(PageBreak())
story += [heading('Full request/response appendix','requests'),p('All 95 selected captures are included below. The order follows the saved report. Repeated calls and retries are intentionally retained. API URLs use the confirmed base plus the path shown. Secret fields remain redacted.'),p(report['base'],'small'),table([['HTTP status','Captures'],*[[escape(k),str(v)]for k,v in sorted(request_counts.items())]],[CW-90,90]),p('Content routes','h2')]
for r in report['requests']:
    if not r['screens']:story.append(p(f'#{r["id"]}: {r["method"]} {r["path"]} -> {r["status"]}. {r.get("note","")}'))
story.append(PageBreak())
for r in report['requests']:
    story += [heading(f'Request #{r["id"]}  |  HTTP {r["status"]}',f'request-{r["id"]}'),p(r['method']+' '+r['path'],'h2'),p(f'Screen entries: {", ".join(f"{n:02d}" for n in r["screens"]) or "Supplemental content routes"} | Duration: {r.get("ms","unknown")} ms','small'),p(f'Captured: {r["at"]} | Source: {r.get("source","CLI live HTTP")}','small')]
    if r.get('expected'):story.append(p('Expected failure: setup/authentication check. This is not counted as an unexpected feature failure.'))
    if r.get('note'):story.append(p(r['note']))
    story += [p('Request body','h2'),rawjson(r.get('request')),p('Response body','h2'),rawjson(r.get('response'))]
    if r.get('error'):story.append(p('Error: '+r['error']))
    story.append(PageBreak())
story += [heading('Audit closure','closure'),p('The requested evidence review covers all 62 original screen entries. It does not certify that all 62 experiences work. Missing backend contracts, incomplete content and reproduced frontend defects are the remaining work.'),p('No Git push or deployment was performed for this audit. The local viewer remains available at http://127.0.0.1:5180/api-audit while the development server is running.'),p('Recorded artifacts','h2'),p('Project: E:/Intership/kidsverseplus\nFull source evidence: docs/api-audit/\nLive screenshot evidence: docs/verification/\nThis PDF: output/pdf/Kidsverse_Full_62_Screen_Live_API_Audit.pdf'),p('Re-test rule','h2'),p('After a new backend release or frontend fix, re-test the affected live flows and date the new report. Do not treat this snapshot or a 200 status alone as approval to release.')]
doc=Doc(str(OUT),pagesize=A4,rightMargin=M,leftMargin=M,topMargin=43,bottomMargin=43,title='Kidsverse+ Full 62-Screen Live API Audit',author='Kidsverse+ Engineering Review',pageCompression=1)
doc.build(story,onFirstPage=chrome,onLaterPages=chrome)
r=PdfReader(OUT)
text='\n'.join(page.extract_text() or '' for page in r.pages)
for s in screens:assert f'SCREEN {s["id"]:02d}' in text,s['id']
for req in report['requests']:assert f'Request #{req["id"]} ' in text,req['id']
assert len(screens)==62 and len(report['requests'])==95
assert all((DATA/'screens'/f'screen-{s["id"]:02d}.png').exists()for s in screens)
meta={'output':str(OUT),'pages':len(r.pages),'screenEntries':62,'selectedRequests':95,'bytes':OUT.stat().st_size,'screenPages':{},'requestPages':{}}
for n,page in enumerate(r.pages,1):
    txt=page.extract_text()or''
    m=re.search(r'SCREEN (\d{2})',txt)
    if m:meta['screenPages'].setdefault(m.group(1),n)
    m=re.search(r'Request #(\d+)\s+\|',txt)
    if m:meta['requestPages'].setdefault(m.group(1),n)
(ROOT/'tmp/pdfs').mkdir(parents=True,exist_ok=True)
(ROOT/'tmp/pdfs/full-audit-meta.json').write_text(json.dumps(meta,indent=2))
print(json.dumps({k:v for k,v in meta.items()if k not in ['screenPages','requestPages']}))
