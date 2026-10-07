"""Print the current verified screen contracts with reference UI images."""
from pathlib import Path
from html import escape
import json, textwrap
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, Preformatted, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
from PIL import Image as PILImage

ROOT = Path(__file__).resolve().parents[1]
REPORT = json.loads((ROOT/'docs/verification/senior-review-api-responses.json').read_text(encoding='utf-8'))
IMAGES = ROOT/'docs/mock-demo/pdf-source/screens'
OUT = ROOT/'output/pdf/Kidsverse_62_Screens_Mock_API_Senior_Review.pdf'
TMP = ROOT/'tmp/pdfs/senior-review'
TMP.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)
CAPTURES = {row['id']: row for row in REPORT['captures']}
SCREENS = REPORT['screens']
assert len(SCREENS) == 62 and REPORT['verified_operations'] == 109

for name, filename in [('UI','segoeui.ttf'),('UIBold','segoeuib.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts')/filename)))
W,H = A4
M = 34
CW = W-2*M
NAVY = colors.HexColor('#17233D')
BLUE = colors.HexColor('#395ED1')
MUTED = colors.HexColor('#64758A')
LINE = colors.HexColor('#DDE5EF')
STYLES = {
    'title': ParagraphStyle('Title',fontName='UIBold',fontSize=17,leading=22,textColor=NAVY,spaceAfter=8),
    'body': ParagraphStyle('Body',fontName='UI',fontSize=9,leading=13,textColor=NAVY,spaceAfter=7),
    'small': ParagraphStyle('Small',fontName='UI',fontSize=8,leading=11,textColor=MUTED,spaceAfter=6),
    'label': ParagraphStyle('Label',fontName='UIBold',fontSize=9,leading=12,textColor=BLUE,spaceBefore=7,spaceAfter=4),
    'cell': ParagraphStyle('Cell',fontName='UI',fontSize=8.5,leading=12,textColor=NAVY,wordWrap='CJK'),
    'code': ParagraphStyle('Code',fontName='Mono',fontSize=8,leading=10.4,textColor=NAVY,spaceAfter=8),
}

def p(text, style='body', raw=False):
    return Paragraph(text if raw else escape(str(text)), STYLES[style])

def title(text, key):
    block = p(text,'title')
    block.outline,block.bookmark = text,key
    return block

def json_text(value, indent=0):
    compact = json.dumps(value,ensure_ascii=True,separators=(', ',': '))
    if len(compact)+indent <= 101:
        return compact
    if isinstance(value,(dict,list)):
        pairs = [(json.dumps(key)+': ',item) for key,item in value.items()] if isinstance(value,dict) else [('',item) for item in value]
        lines,current = [],''
        prefix = ' '*(indent+2)
        for index,(key,item) in enumerate(pairs):
            part = key+json_text(item,indent+2)+(',' if index<len(pairs)-1 else '')
            if '\n' in part:
                if current:
                    lines.append(current);current=''
                lines.extend([prefix+part.split('\n')[0],*part.split('\n')[1:]])
            elif current and len(current)+1+len(part)<=104:
                current += ' '+part
            else:
                if current:
                    lines.append(current)
                current = prefix+part
        if current:
            lines.append(current)
        start,end = ('{','}') if isinstance(value,dict) else ('[',']')
        return start+'\n'+'\n'.join(lines)+'\n'+' '*indent+end
    return compact

class JsonBlock(Preformatted):
    def split(self,availWidth,availHeight):
        count = int(availHeight/self.style.leading)
        if count < 3:
            return []
        if 0 < len(self.lines)-count < 10:
            count = max(3,len(self.lines)-10)
        if count < 3:
            return []
        return [JsonBlock('\n'.join(self.lines[:count]),self.style),JsonBlock('\n'.join(self.lines[count:]),self.style)]

def code(value):
    raw = json_text(value)
    assert json.loads(raw) == value
    lines = []
    for line in raw.splitlines():
        lead = len(line)-len(line.lstrip())
        lines.extend(textwrap.wrap(line,width=108,subsequent_indent=' '*min(lead+2,16),replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False) or [''])
    assert all(pdfmetrics.stringWidth(line,'Mono',8) <= CW for line in lines)
    return JsonBlock('\n'.join(lines),STYLES['code'])

def add_json(blocks,label,value):
    block = code(value)
    if len(block.lines)<=18:
        blocks.append(KeepTogether([p(label,'label'),block]))
        return
    blocks.append(KeepTogether([p(label,'label'),JsonBlock('\n'.join(block.lines[:4]),STYLES['code'])]))
    if len(block.lines)>14:
        blocks.append(JsonBlock('\n'.join(block.lines[4:-10]),STYLES['code']))
    blocks.append(KeepTogether([JsonBlock('\n'.join(block.lines[-10:]),STYLES['code'])]))

def method_table(row):
    table = Table([[p('Method / endpoint','cell'),p('HTTP','cell')],[p(row['method']+' '+row['path'],'cell'),p(row['status'],'cell')]],colWidths=[CW-47,47],repeatRows=1,hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#EEF2F8')),('LINEBELOW',(0,0),(-1,-1),.4,LINE),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    return table

def screenshot(sid):
    path = IMAGES/f'screen-{sid:02d}.png'
    assert path.exists(),path
    with PILImage.open(path) as image:
        width,height = image.size
    scale = min(CW/width,280/height)
    return Image(str(path),width=width*scale,height=height*scale,hAlign='CENTER')

EXAMPLES = REPORT['senior_review']['examples']
CALLS = {s['id']:[rid for rid in s['capture_ids'] if CAPTURES[rid]['origin'] != 'mock' or CAPTURES[rid]['path']=='/demo/login'] for s in SCREENS}
CONTENT = [rid for rid in EXAMPLES['supporting'] if CAPTURES[rid]['role']=='admin' or CAPTURES[rid]['operation'].startswith(('/curriculum','/themes','/subjects/'))]
SUPPORTING = [rid for rid in EXAMPLES['supporting'] if rid not in CONTENT]
SECTIONS = [
    ('common','COMMON HEADERS AND LIVE ALIGNMENT',[]),
    ('challenge','CHALLENGE PRACTICE - FULL FLOW',EXAMPLES['challenge']),
    ('resume','RESUME, HISTORY AND BATTLE REVIEW',EXAMPLES['resume']),
    ('retry','IDEMPOTENT RETRY EXAMPLES',EXAMPLES['idempotency']),
    ('errors','VALIDATION AND ERROR RESPONSES',EXAMPLES['errors']),
    ('supporting','SUPPORTING ACCOUNT AND ASSESSMENT APIS',SUPPORTING),
    ('content','DB CONTENT - AUTHORING AND PUBLICATION',CONTENT),
]
USED = set(rid for ids in CALLS.values() for rid in ids)|set(rid for _,_,ids in SECTIONS for rid in ids)
LONG = {rid for rid in USED if len(json_text(CAPTURES[rid]['response']))>1000}
LONG_REQUEST = {rid for rid in USED if CAPTURES[rid]['request'] is not None and len(json_text(CAPTURES[rid]['request']))>1000}
ORIGINS = {'senior':'Documented route / proposed mock response','proposed':'Proposed live API','compatibility':'Compatibility API','mock':'Local mock helper'}
LOCATIONS = {}
SECTION_NAMES = dict((key,name) for key,name,_ in SECTIONS)

class Doc(SimpleDocTemplate):
    def afterFlowable(self,flow):
        if hasattr(flow,'bookmark'):
            self.current = flow.outline
            self.locations[flow.bookmark] = self.page
            self.canv.bookmarkPage(flow.bookmark)
            self.canv.addOutlineEntry(flow.outline,flow.bookmark,level=0,closed=True)

def chrome(canvas,doc):
    canvas.saveState()
    canvas.setFillColor(MUTED)
    canvas.setFont('UI',7)
    canvas.drawString(M,H-18,'KIDSVERSE+ | MOCK API PROPOSAL | 62 SCREENS')
    canvas.setStrokeColor(LINE)
    canvas.line(M,H-24,W-M,H-24)
    canvas.line(M,29,W-M,29)
    canvas.drawString(M,18,'Screen reference image | Actual local HTTP payloads | Credentials redacted')
    canvas.drawRightString(W-M,18,f'Page {doc.page}')
    active = max(((page,key) for key,page in LOCATIONS.items() if page<=doc.page),default=None)
    if active:
        key = active[1]
        if key.startswith('screen-'):
            sid = int(key.split('-')[1])
            header = f'SCREEN {sid:02d}  {SCREENS[sid-1]["name"]}'
        elif key.startswith('response-'):
            header = f'RESPONSE R{int(key.split("-")[1]):03d} - COMPLETE JSON'
        elif key.startswith('request-'):
            header = f'REQUEST Q{int(key.split("-")[1]):03d} - COMPLETE JSON'
        else:
            header = SECTION_NAMES[key]
        canvas.setFont('UI',6.5)
        canvas.drawRightString(W-M,H-18,header[:65])
    canvas.restoreState()

def shared_json(blocks,label,rid,request=False):
    kind = 'request' if request else 'response'
    prefix = 'Q' if request else 'R'
    page = LOCATIONS.get(f'{kind}-{rid}')
    text = f'Complete JSON {kind} {prefix}{rid:03d}'+(f' - page {page}' if page else '')
    blocks.append(KeepTogether([p(label,'label'),p(f'<link href="#{kind}-{rid}" color="#395ED1"><b>{text}</b></link>','body',True)]))

def add_call(blocks,rid):
    row = CAPTURES[rid]
    blocks.append(p(row.get('label',ORIGINS[row['origin']]),'label'))
    if row.get('label'):
        blocks.append(p(ORIGINS[row['origin']],'small'))
    blocks.append(method_table(row))
    # Older captures did not export request headers. Their authorization
    # requirements come from the same validated operation registry.
    headers = row.get('request_headers',{})
    if row['role']=='parent':
        blocks.append(p('Authorization: Bearer [redacted]','small'))
    elif row['role']=='admin':
        blocks.append(p('X-Mock-Content-Admin-Key: [redacted] (local server authoring role)','small'))
    else:
        blocks.append(p('Authorization: public endpoint','small'))
    for name in ['Idempotency-Key','X-Parent-PIN-Proof']:
        if name in headers:
            blocks.append(p(name+': '+headers[name],'small'))
    if row['request'] is None:
        blocks.append(KeepTogether([p('Request JSON','label'),p('No request body.','small')]))
    elif rid in LONG_REQUEST:
        shared_json(blocks,'Request JSON',rid,True)
    else:
        add_json(blocks,'Request JSON',row['request'])
    if rid in LONG:
        shared_json(blocks,'Response JSON',rid)
    elif row['status']==204:
        blocks.append(KeepTogether([p('Response','label'),p('No response body (HTTP 204).','small')]))
    else:
        add_json(blocks,'Response JSON',row['response'])

def story():
    blocks = []
    for screen in SCREENS:
        sid = screen['id']
        if blocks:
            blocks.append(PageBreak())
        blocks.append(title(f'SCREEN {sid:02d}  {screen["name"]}',f'screen-{sid}'))
        if sid == 1:
            blocks.append(p('For senior review: requested live API behaviour, using verified local mock payloads. Images are saved UI references; they do not certify live integration. Examples use separate isolated sessions; IDs belong to their captured flow.','small'))
            blocks.append(p('Mock base: http://127.0.0.1:5180/api/v1 | Captured: '+REPORT['generated_at'][:10],'small'))
        blocks.extend([screenshot(sid),Spacer(1,7)])
        if sid == 1:
            blocks.append(p('No backend request required. Request: none. Response: none.'))
            continue
        if sid == 2:
            blocks.append(p('Live proposal: extend POST /auth/parent/login to return token, parent, students and bootstrap resources. Standard login below currently returns parent/token only. The full /demo/login response is the actual mock-only aggregate reference, not a released live endpoint. Cache ordinary reads; saves and assessment actions still call the server.','small'))
        if sid in [41,49]:
            page = LOCATIONS.get('challenge')
            blocks.append(p(f'<link href="#challenge" color="#395ED1">Challenge practice uses its own challenge test_id; full start, question, answer, result and review flow'+(f' - page {page}' if page else '')+'.</link>','small',True))
        if sid in [47,48]:
            blocks.append(p('Completion is self-reported. No audio upload, speech recognition, fluency score or voice assessment provider is implemented by these endpoints; provider contracts remain to be agreed.','small'))
        if 27 <= sid <= 36:
            blocks.append(p('Shared mission response supplies all learning steps and example ways; no extra read per step.','small'))
        for rid in CALLS[sid]:
            add_call(blocks,rid)
    for key,name,ids in SECTIONS:
        blocks.extend([PageBreak(),title(name,key)])
        if key=='common':
            for line in [
                'All paths are relative to /api/v1. Headers: Accept: application/json; Content-Type: application/json for JSON request bodies.',
                'Parent routes require Authorization: Bearer [parent token]. The server checks student ownership; a different parent cannot read or change a child.',
                'Idempotency-Key is optional on mutations: same key + same payload returns the original successful response; a conflicting payload returns 409. GET and PIN verify/authorize run fresh.',
                'X-Parent-PIN-Proof: [proof token] is currently optional on /parent/overview, /parent/evidence and /parent/plan. When supplied, parent ownership and five-minute expiry are checked. Mandatory PIN protection for live reports needs senior agreement.',
                'Content writes require the local server-only X-Mock-Content-Admin-Key. Parent bearer tokens cannot author content. Live content authoring requires the agreed admin authentication/role; this local key is not a public frontend credential.',
                'Login bootstrap is proposed for ordinary session reads. The captured mock helper includes screen/demo presentation metadata; production should agree the token/parent/students/resource envelope and omit mock presentation fixtures.',
                'Published DB content supplies Learn, CFU, normal Test, Challenge practice and Battle banks. Formal question delivery omits answer keys. Draft changes do not alter active attempt snapshots.',
                'Nova replies are scripted; leaderboard opponents/ranks are fixtures. Reading/speaking completion is self-reported. Asset upload, real AI/voice grading and SMS/email delivery providers remain separate live integrations.',
            ]:
                blocks.append(p(line))
        if key=='challenge':
            blocks.append(p('Separate Challenge question bank. Routes reuse the Test attempt API; metadata and results explicitly identify assessment_type: challenge.','small'))
        if key=='retry':
            blocks.append(p('Both captured child-creation calls use the same Idempotency-Key and return the same child ID. The conflicting retry is shown in the error section.','small'))
        if key=='errors':
            blocks.append(p('Actual rejected HTTP requests. PIN 429 follows five failed attempts; proof 410 uses an advanced isolated test clock after five minutes.','small'))
        if key=='content':
            blocks.append(p('Catalogue CRUD and versioned content feed/draft/update/publish/unpublish/archive. Complete content request bodies are linked below; optimistic updates require expected_version.','small'))
        for rid in ids:
            add_call(blocks,rid)
    for rid in sorted(LONG_REQUEST):
        row = CAPTURES[rid]
        blocks.extend([PageBreak(),title(f'REQUEST Q{rid:03d} - COMPLETE JSON',f'request-{rid}')])
        blocks.append(method_table(row))
        add_json(blocks,'Request JSON',row['request'])
    for rid in sorted(LONG):
        row = CAPTURES[rid]
        blocks.extend([PageBreak(),title(f'RESPONSE R{rid:03d} - COMPLETE JSON',f'response-{rid}')])
        ids = [s['id'] for s in SCREENS if rid in CALLS[s['id']]]
        blocks.append(p('For screens: '+', '.join(f'{sid:02d}' for sid in ids) if ids else 'Supporting API response','small'))
        if row['path']=='/demo/login':
            blocks.append(p('Actual mock-only aggregate reference. The standard live login extension remains proposed. Includes demo/screen fixtures that should not be copied into production.','small'))
        blocks.append(method_table(row))
        add_json(blocks,'Response JSON',row['response'])
    return blocks

for _ in range(2):
    doc = Doc(str(OUT),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=38,bottomMargin=38,pageCompression=1,title='Kidsverse+ - 62 Screens - Mock API Proposal',author='Kidsverse+ Frontend API Requirements')
    doc.locations,doc.current = {},''
    doc.build(story(),onFirstPage=chrome,onLaterPages=chrome)
    LOCATIONS = dict(doc.locations)
reader = PdfReader(OUT)
texts = [page.extract_text() or '' for page in reader.pages]
text = '\n'.join(texts)
assert all(f'SCREEN {sid:02d} ' in text for sid in range(1,63))
assert len(reader.outline) == 62+len(SECTIONS)+len(LONG)+len(LONG_REQUEST)
assert '/talk-nova/complete' in text
assert len(SCREENS) == len(list(IMAGES.glob('screen-*.png'))) == 62
assert all(len(page.images)>0 for key,page_num in LOCATIONS.items() if key.startswith('screen-') for page in [reader.pages[page_num-1]])
assert all(len(t.strip())>150 for t in texts), 'Unexpected blank page'
assert 'CHALLENGE PRACTICE - FULL FLOW' in text and 'Authorization: Bearer' in text and 'X-Parent-PIN-Proof' in text
assert set(CAPTURES[rid]['status'] for rid in USED)>={200,201,204,400,401,403,404,409,410,429}
assert len({CAPTURES[rid]['method']+' '+CAPTURES[rid]['operation'] for rid in USED if CAPTURES[rid]['origin']!='mock' and CAPTURES[rid]['status']<400})==REPORT['senior_review']['non_mock_operations']
assert len(CAPTURES[EXAMPLES['populated']['parent/evidence']]['response']['students'][0]['evidence'])==4
metadata = {'pdf':str(OUT),'pages':len(reader.pages),'screens':62,'non_mock_operations':REPORT['senior_review']['non_mock_operations'],'unique_captures':len(USED),'shared_responses':len(LONG),'shared_requests':len(LONG_REQUEST),'bytes':OUT.stat().st_size,'locations':LOCATIONS}
(TMP/'metadata.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print(json.dumps({key:value for key,value in metadata.items() if key!='locations'}))
