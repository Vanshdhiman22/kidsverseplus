from pathlib import Path
from html import escape
import json, textwrap, re, sys
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, Preformatted, KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
from PIL import Image as PILImage

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/mock-demo/pdf-source'
OUT=ROOT/'output/pdf/Kidsverse_62_Screens_Proposed_Mock_APIs.pdf'
DATA=json.loads((SOURCE/'screen-contract.json').read_text(encoding='utf-8'))
LIVE='--live' in sys.argv
if LIVE:
    SOURCE=ROOT/'docs/api-audit'
    OUT=ROOT/'output/pdf/Kidsverse_62_Screens_Live_API_Responses.pdf'
    report=json.loads((SOURCE/'report.json').read_text(encoding='utf-8'))
    original=json.loads((SOURCE/'archive-20261001-173036/report.json').read_text(encoding='utf-8'))
    manifest=json.loads((SOURCE/'screens.json').read_text(encoding='utf-8'))
    rows=list(report['requests'])+[r for r in original['requests'] if r['path'] in ['/auth/parent/signup','/students'] and r['method']=='POST' and r.get('ok')]
    captures=[]
    for i,r in enumerate(rows,1):
        assert report['base'].startswith('https://kidsverse-apinew.vercel.app/')
        assert '/demo/' not in r['path']
        captures.append({**r,'id':i,'headers':{}})
    DATA={'title':'Kidsverse+ - All 62 Screens / Live API Responses','base':report['base'],'captures':captures,'screens':[],'started':report['started'],'finished':report['finished']}
    for s in manifest:
        calls=[{'capture':r['id'],'label':'Live HTTP capture'} for r in captures if s['id'] in r.get('screens',[])]
        notes=[]
        if s['documentStatus']=='Not documented':notes.append('This feature endpoint is absent from the two newer API documents; live probe shown below.')
        if not calls and s['id']!=1:
            notes.append('No live request/response captured for this screen. Dependencies or an unavailable route prevented a complete test.')
            notes.extend(f['text'] for f in report['findings'] if s['id'] in f['screens'] and any(w in f['text'].lower() for w in ['no ', 'failed', 'blocked']))
        DATA['screens'].append({**s,'calls':calls,'note':' '.join(dict.fromkeys(notes))})
CAPTURES={r['id']:r for r in DATA['captures']}
USED=set(c['capture'] for s in DATA['screens'] for c in s['calls'])
FONT=Path('C:/Windows/Fonts')
for name,file in [('UI','segoeui.ttf'),('UIBold','segoeuib.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
W,H=A4; M=35; CW=W-2*M
NAVY=colors.HexColor('#17233D'); BLUE=colors.HexColor('#395ED1'); MUTED=colors.HexColor('#64758A'); LINE=colors.HexColor('#DDE5EF')
STYLES={
 'title':ParagraphStyle('Title',fontName='UIBold',fontSize=19,leading=24,textColor=NAVY,spaceAfter=10),
 'body':ParagraphStyle('Body',fontName='UI',fontSize=9,leading=13,textColor=NAVY,spaceAfter=6),
 'small':ParagraphStyle('Small',fontName='UI',fontSize=8,leading=11,textColor=MUTED,spaceAfter=5),
 'label':ParagraphStyle('Label',fontName='UIBold',fontSize=10,leading=14,textColor=BLUE,spaceBefore=9,spaceAfter=5),
 'cell':ParagraphStyle('Cell',fontName='UI',fontSize=8,leading=11,textColor=NAVY),
 'code':ParagraphStyle('Code',fontName='Mono',fontSize=7.5,leading=10,textColor=NAVY,spaceAfter=8),
}
def p(text,style='body',raw=False):return Paragraph(text if raw else escape(str(text)),STYLES[style])
def title(text,key):
    block=p(text,'title');block.outline=text;block.bookmark=key;return block
def json_text(v,indent=0):
    # Valid full JSON, with compact short collections; never cut off values.
    one=json.dumps(v,ensure_ascii=True,separators=(', ',': '))
    if len(one)+indent<=104:return one
    if isinstance(v,dict):
        return '{\n'+',\n'.join(' '*(indent+2)+json.dumps(k)+': '+json_text(x,indent+2) for k,x in v.items())+'\n'+' '*indent+'}'
    if isinstance(v,list):
        return '[\n'+',\n'.join(' '*(indent+2)+json_text(x,indent+2) for x in v)+'\n'+' '*indent+']'
    return one
class JsonBlock(Preformatted):
    def split(self,availWidth,availHeight):
        count=int(availHeight/self.style.leading)
        if count<3:return []
        if len(self.lines)-count in (1,2):count-=3
        if count<3:return []
        return [JsonBlock('\n'.join(self.lines[:count]),self.style),JsonBlock('\n'.join(self.lines[count:]),self.style)]
def code(v):
    raw=json_text(v);assert json.loads(raw)==v
    lines=[]
    for line in raw.splitlines():
        # Wrap display lines only. All JSON values remain in the PDF.
        lead=len(line)-len(line.lstrip());continuation=' '*min(lead+2,16)
        lines.extend(textwrap.wrap(line,width=112,subsequent_indent=continuation,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False) or [''])
    return JsonBlock('\n'.join(lines),STYLES['code'])
def table(rows):
    cells=[[p(x,'cell')for x in row]for row in rows]
    t=Table(cells,colWidths=[CW-48,48],repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#EEF2F8')),('LINEBELOW',(0,0),(-1,-1),.4,LINE),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    return t
def screen_image(sid):
    path=SOURCE/'screens'/f'screen-{sid:02d}.png';assert path.exists(),path
    im=PILImage.open(path);w,h=im.size;scale=min(CW/w,310/h)
    return Image(str(path),width=w*scale,height=h*scale,hAlign='CENTER')
LONG={rid for rid in USED if len(json_text(CAPTURES[rid]['response']))>2100}
class Doc(SimpleDocTemplate):
    current='';locations={}
    def afterFlowable(self,flow):
        if hasattr(flow,'bookmark'):
            self.current=flow.outline;self.locations[flow.bookmark]=self.page
            self.canv.bookmarkPage(flow.bookmark);self.canv.addOutlineEntry(flow.outline,flow.bookmark,level=0,closed=True)
def chrome(c,d):
    c.saveState();c.setFillColor(MUTED);c.setFont('UI',7)
    c.drawString(M,H-19,'KIDSVERSE+  |  '+('LIVE API RESPONSES' if LIVE else 'PROPOSED MOCK API CONTRACT'))
    c.setStrokeColor(LINE);c.line(M,H-25,W-M,H-25)
    c.line(M,29,W-M,29);c.drawString(M,18,'Saved live responses / Reference images / Credentials redacted' if LIVE else 'Local mock / Sample data / Credentials redacted')
    c.drawRightString(W-M,18,f'Page {d.page}');c.restoreState()
story=[]
for s in DATA['screens']:
    if story:story.append(PageBreak())
    story.append(title(f'SCREEN {s["id"]:02d}  {s["name"]}',f'screen-{s["id"]}'))
    if s['id']==1:
        story.append(p('62 screens with saved live request and response bodies.' if LIVE else 'Requested API format for senior review. 62 mock screens with request and response JSON.'))
        story.append(p('Base URL: '+DATA['base'],'small'))
        story.append(p(('Live captures: '+DATA['started']+' to '+DATA['finished']+'. Signup and child creation use the earlier saved audit. Images are references from the 62-screen PDF, not proof of live screen success.') if LIVE else 'Images show the mock UI; payloads are successful sample calls to the same mock engine. Separate sample sessions are used.','small'))
    story += [screen_image(s['id']),Spacer(1,7),p('Screen route: '+s['route'],'small')]
    if LIVE:story.append(p('Image: original screen reference, page '+str(s['id'])+'.','small'))
    if s['note']:story.append(p(s['note'],'small'))
    if not s['calls']:
        story += [table([['Method / endpoint','HTTP'],['No API required' if s['id']==1 else ('Not captured' if LIVE else 'No API request'),'N/A']]),p('Request: none. Response: none.' if s['id']==1 or not LIVE else 'Request/response unavailable; no successful response is asserted.')]
        continue
    for link in s['calls']:
        r=CAPTURES[link['capture']]
        story.append(p(link['label'] or 'Mock API','label'))
        story.append(table([['Method / endpoint','HTTP'],[r['method']+' '+r['path'],str(r['status'])]]))
        if 'Authorization' in r['headers']:story.append(p('Authorization: Bearer [redacted]','small'))
        if LIVE:
            story.append(p('Captured: '+r.get('at',report['started']),'small'))
            if r.get('error'):story.append(p('Network error: '+r['error'],'small'))
        story.append(p('Request JSON','label'))
        story.append(p('No request body.','small') if r['request'] is None else code(r['request']))
        story.append(p('Response JSON','label'))
        if r['id'] in LONG:
            story.append(p(f'<link href="#response-{r["id"]}" color="#395ED1"><b>Open full JSON response R{r["id"]:03d}</b></link> - shared payload included later in this PDF.','body',True))
        else:story.append(code(r['response']))
if LIVE:
    extra=[r for r in DATA['captures'] if not r.get('screens')]
    if extra:
        story.append(PageBreak());story.append(title('CONTENT API RESPONSES','content-api'))
        for r in extra:
            story.append(table([['Method / endpoint','HTTP'],[r['method']+' '+r['path'],str(r['status'])]]))
            story.append(p('Request JSON','label'));story.append(p('No request body.','small') if r['request'] is None else code(r['request']))
            story.append(p('Response body','label'));story.append(code(r['response']))
for rid in sorted(LONG):
    r=CAPTURES[rid];story.append(PageBreak())
    story.append(title(f'FULL RESPONSE R{rid:03d}',f'response-{rid}'))
    ids=[s['id']for s in DATA['screens']if any(c['capture']==rid for c in s['calls'])]
    story.append(p('Used by screens: '+', '.join(f'{x:02d}'for x in ids),'small'))
    story.append(table([['Method / endpoint','HTTP'],[r['method']+' '+r['path'],str(r['status'])]]))
    story.append(p('Response JSON - complete payload','label'));story.append(code(r['response']))
OUT.parent.mkdir(parents=True,exist_ok=True)
doc=Doc(str(OUT),pagesize=A4,leftMargin=M,rightMargin=M,topMargin=38,bottomMargin=38,pageCompression=1,title=DATA['title'],author='Kidsverse+ Frontend API Requirements')
doc.build(story,onFirstPage=chrome,onLaterPages=chrome)
reader=PdfReader(OUT);text='\n'.join(page.extract_text()or''for page in reader.pages)
for s in DATA['screens']:assert f'SCREEN {s["id"]:02d}' in text
for rid in LONG:assert f'FULL RESPONSE R{rid:03d}' in text
assert len(reader.outline)==62+len(LONG)+(1 if LIVE and extra else 0)
assert len(list((SOURCE/'screens').glob('screen-*.png')))==62
assert '... omitted' not in text and 'truncated' not in text
metadata={'pdf':str(OUT),'pages':len(reader.pages),'screens':62,'uniqueResponseCaptures':len(USED),'sharedFullResponses':len(LONG),'bytes':OUT.stat().st_size,'locations':doc.locations}
(ROOT/('tmp/pdfs/live-response-pdf-meta.json' if LIVE else 'tmp/pdfs/mock-contract-pdf-meta.json')).write_bytes(json.dumps(metadata,indent=2).encode('utf-8'))
print(json.dumps({k:v for k,v in metadata.items()if k!='locations'}))
