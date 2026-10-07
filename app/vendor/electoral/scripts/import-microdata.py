"""Reproducible aggregates from official CIS 3577, with no interview identifiers."""
from pathlib import Path
import zipfile,csv,io,json,hashlib,collections
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'research/microdata/MD3577.zip'
rows=list(csv.DictReader(io.StringIO(zipfile.ZipFile(SOURCE).read('3577_etiq.csv').decode('utf-8-sig')),delimiter=';'))
keys={k.split(':')[0]:k for k in rows[0]}
labels={'PSOE':'psoe','PP':'pp','VOX':'vox','Sumar':'sumar','Podemos':'podemos','Se Acabó la Fiesta':'salf','ERC':'erc','Junts':'junts','EH Bildu':'bildu','EAJ-PNV':'pnv','BNG':'bng','CCa':'cc','UPN':'upn','PACMA':'pacma','Adelante Andalucía':'aa','Otro partido':'others','29':'unidentified29','En blanco':'blank','Voto nulo':'null','Nulo':'null','No votaría':'abstention','No votó':'abstention','No sabe todavía':'undecided','N.C.':'noanswer','N.R.':'norecall','No tenía edad':'underage','No tenía derecho a voto':'ineligible'}
ages=['18–24','25–34','35–44','45–54','55–64','65 o más']
cells=collections.defaultdict(lambda:[0,0.,0.]);missing=collections.Counter()
for row in rows:
 def v(key):return row[keys[key]]
 age=int(v('EDAD'));agegroup=next((g for g,limit in zip(ages,[24,34,44,54,64,200]) if age<=limit),'No disponible')
 sex=v('SEXO');ideology=v('ESCIDEOL'); ideology=ideology.split(' ')[0] if ideology[0].isdigit() else ideology
 turnout=v('PROBVOTO');turnout=turnout.split(' ')[0] if turnout[0].isdigit() else 'No disponible'
 intent=labels.get(v('INTENCIONGR'));recall=labels.get(v('RECUERDO'))
 if intent is None or recall is None:raise ValueError('Unknown response category')
 w=float(v('PESO').replace(',','.'))
 for dim,group in [('total','Total'),('age',agegroup),('sex',sex),('sexAge',sex+' · '+agegroup),('income',v('INGRESHOG')),('ideology',ideology),('recall',recall)]:
  a=cells[(dim,group,recall,intent,turnout)];a[0]+=1;a[1]+=w;a[2]+=w*w
result={'schemaVersion':1,'study':'3577','title':'Barómetro de septiembre de 2026','sample':len(rows),'fieldworkStart':'2026-09-01','fieldworkEnd':'2026-09-04','sourceUrl':'https://www.cis.es/documents/20117/14250083/MD3577.zip','studyUrl':'https://www.cis.es/es/estudios/barometro-de-septiembre-2026','technicalUrl':'https://www.cis.es/documents/20117/14250083/FT3577.pdf','questionnaireUrl':'https://www.cis.es/documents/20117/14250083/cues3577.pdf','codebook':'codigo3577.pdf, incluido en MD3577.zip','sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'weight':'PESO, ponderación con ajuste por estudios','variables':{'intent':'INTENCIONGR (P22R)','recall':'RECUERDO (P28aa)','turnout':'PROBVOTO (P20)','sex':'SEXO','age':'EDAD','income':'INGRESHOG','ideology':'ESCIDEOL'},'note':'La etiqueta 29 aparece como 29 en INTENCIONGR y el libro de códigos: no se identifica como una candidatura concreta. Los datos contienen agregados, no identificadores ni entrevistas individuales.','labels':{value:key for key,value in labels.items()},'dimensions':{'total':'Total nacional','age':'Edad','sex':'Sexo','sexAge':'Sexo y edad','income':'Ingresos del hogar','ideology':'Ideología (1 izquierda, 10 derecha)','recall':'Recuerdo de voto 2023'},'cells':[{'dimension':d,'group':g,'recall':r,'intent':i,'turnout':t,'n':a[0],'w':round(a[1],8),'w2':round(a[2],8)} for (d,g,r,i,t),a in cells.items()]}
result['labels'].update({'unidentified29':'Categoría 29 sin identificar','null':'Voto nulo','abstention':'No votaría / no votó','undecided':'No sabe todavía','noanswer':'No contesta','norecall':'No recuerda','underage':'No tenía edad','ineligible':'No tenía derecho a voto'})
(ROOT/'data/microdata-3577.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'{len(rows)} entrevistas; {len(cells)} celdas; archivo agregado generado')
