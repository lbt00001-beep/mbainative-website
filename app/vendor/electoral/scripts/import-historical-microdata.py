from pathlib import Path
import zipfile,io,csv,json,collections,hashlib
root=Path(__file__).resolve().parents[1];zipfiledata=root/'research/microdata/MD3411.zip';outer=zipfile.ZipFile(zipfiledata);z=zipfile.ZipFile(io.BytesIO(outer.read('3411csv.zip')));rows=list(csv.DictReader(io.StringIO(z.read('3411_etiq.csv').decode('utf-8-sig')),delimiter=';'));keys={k.split(' ')[0]:k for k in rows[0]}
intent={'PP':'pp','PSOE':'psoe','VOX':'vox','Sumar':'sumar','No sabe todavía':'undecided','N.C.':'noanswer','No votaría':'abstention','En blanco':'blank','Voto nulo':'null'}
recall={'PP':'pp','PSOE':'psoe','VOX':'vox','UP':'left','En Comú Podem':'left','En Común-UP':'left',"C's":'cs','No votó':'abstention','No recuerda':'norecall','No tenía edad':'underage','No tenía derecho a voto':'ineligible','N.C.':'noanswer'}
cells=collections.defaultdict(lambda:[0,0.,0.])
for row in rows:
 p=row[keys['PROBVOTO']];p=p.split(' ')[0] if p[0].isdigit() else 'No disponible';r=recall.get(row[keys['RECUERDO']],'others');i=intent.get(row[keys['INTENCIONGR']],'others');w=float(row[keys['PESO']].replace(',','.'));c=cells[r,i,p];c[0]+=1;c[1]+=w;c[2]+=w*w
history=json.loads((root/'calibration/historical-territory.json').read_text(encoding='utf-8'));prior=next(e for e in history if e['date']=='2019-11-10');votes=collections.Counter()
for p in prior['provinces']:votes.update(p['votes'])
reference={id:votes.get(key,0) for id,key in [('pp','pp'),('psoe','psoe'),('vox','vox'),('left','left'),('cs','historical_Cs')]}
output={'schemaVersion':1,'study':'3411','sample':len(rows),'dimensions':{'total':'Total'},'labels':{},'reference':reference,'referenceElection':'2019-11-10','sourceUrl':'https://www.cis.es/documents/20117/1557956/MD3411.zip','technicalUrl':'https://www.cis.es/documents/20117/1557956/FT3411.pdf','sha256':hashlib.sha256(zipfiledata.read_bytes()).hexdigest(),'cells':[dict(dimension='total',group='Total',recall=r,intent=i,turnout=t,n=v[0],w=v[1],w2=v[2]) for (r,i,t),v in cells.items()]}
(root/'calibration/microdata-3411.json').write_text(json.dumps(output,ensure_ascii=False),encoding='utf-8')
print(reference)
