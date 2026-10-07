#!/usr/bin/env python3
"""Read-only WordPress inventory to an owned Next.js catalog and private manifest."""
import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import unicodedata
from urllib.parse import quote, unquote, urlsplit
PHP_QUERY = "global $wpdb;\n$out=array();\n$out[\"posts\"]=$wpdb->get_results(\"SELECT ID,post_type,post_title,post_name,post_date_gmt,post_content,post_excerpt,post_password,post_parent FROM wp_posts WHERE post_status='publish' AND post_type IN ('shiurim','videos','page') ORDER BY ID\",ARRAY_A);\n$out[\"terms\"]=$wpdb->get_results(\"SELECT t.term_id,t.name,t.slug,tt.taxonomy,tt.parent,tt.count,tt.description FROM wp_terms t JOIN wp_term_taxonomy tt ON tt.term_id=t.term_id WHERE tt.taxonomy IN ('courses','series','parshios','authors','post_tag','types','parshas')\",ARRAY_A);\n$out[\"relations\"]=$wpdb->get_results(\"SELECT tr.object_id,tt.term_id,tt.taxonomy FROM wp_term_relationships tr JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id JOIN wp_posts p ON tr.object_id=p.ID WHERE p.post_status='publish' AND p.post_type IN ('shiurim','videos','page')\",ARRAY_A);\n$keys=array(\"_shiurim:enclosure\",\"enclosure\",\"video_url\",\"shiur_dedicationsponsor\",\"_thumbnail_id\");\n$sql=\"SELECT pm.post_id,pm.meta_key,pm.meta_value FROM wp_postmeta pm JOIN wp_posts p ON p.ID=pm.post_id WHERE p.post_status='publish' AND p.post_type IN ('shiurim','videos','page') AND pm.meta_key IN ('_shiurim:enclosure','enclosure','video_url','shiur_dedicationsponsor','_thumbnail_id')\";\n$out[\"meta\"]=array();\nforeach($wpdb->get_results($sql,ARRAY_A) as $m){\n if(strpos($m[\"meta_key\"],\"enclosure\")!==false){\n  $lines=explode(\"\\n\",$m[\"meta_value\"]);$attrs=isset($lines[3])?@unserialize($lines[3],array(\"allowed_classes\"=>false)):array();\n  $m[\"meta_value\"]=array(\"url\"=>$lines[0]??\"\",\"size\"=>$lines[1]??\"\",\"mime\"=>$lines[2]??\"\",\"duration\"=>is_array($attrs)?($attrs[\"duration\"]??\"\"):\"\");\n }\n $out[\"meta\"][]=$m;\n}\n$out[\"termmeta\"]=$wpdb->get_results(\"SELECT tm.term_id,tm.meta_key,tm.meta_value FROM wp_termmeta tm WHERE tm.meta_key IN ('taxonomy_description','hebrew_translation')\",ARRAY_A);\n$out[\"protection\"]=$wpdb->get_results(\"SELECT content_id,level_id,type FROM wp_wlm_contentlevels WHERE level_id IN ('Protection','Inherit')\",ARRAY_A);\n$out[\"counts\"]=$wpdb->get_results(\"SELECT post_type,post_status,COUNT(*) AS total FROM wp_posts GROUP BY post_type,post_status\",ARRAY_A);\n\n$users=$wpdb->get_results(\"SELECT ID,user_email,display_name,user_pass,user_registered FROM wp_users\",ARRAY_A);\n$assignments=$wpdb->get_results(\"SELECT ID,user_id,level_id FROM wp_wlm_userlevels WHERE level_id IN ('1518450894','1529520606')\",ARRAY_A);\n$policies=@unserialize($wpdb->get_var(\"SELECT option_value FROM wp_wlm_options WHERE option_name='wpm_levels'\"),array(\"allowed_classes\"=>false));\n$opts=array();foreach($wpdb->get_results(\"SELECT userlevel_id,option_name,option_value FROM wp_wlm_userlevel_options WHERE option_name IN ('expired','cancelled','unconfirmed','forapproval','registration_date','wlm_schedule_level_cancel') OR option_name LIKE 'scheduled_%'\",ARRAY_A) as $r){$opts[$r[\"userlevel_id\"]][$r[\"option_name\"]]=$r[\"option_value\"];}\n$byuser=array();foreach($assignments as $a){$byuser[$a[\"user_id\"]][]=$a;}\n$out[\"identities\"]=array();$stats=array(\"identities\"=>count($users),\"members\"=>0,\"inactivePremiumAssignments\"=>0,\"unresolvedPremiumAssignments\"=>0);\nforeach($users as $u){\n $untils=array();$lifetime=false;\n foreach($byuser[$u[\"ID\"]]??array() as $a){\n  $o=$opts[$a[\"ID\"]]??array();$blocked=false;\n  foreach(array(\"expired\",\"cancelled\",\"unconfirmed\",\"forapproval\") as $flag){if(!empty($o[$flag]) && $o[$flag]!==\"0\")$blocked=true;}\n  foreach(array_keys($o) as $key){if(strpos($key,\"scheduled_\")===0)$blocked=true;}\n  if($blocked){$stats[\"inactivePremiumAssignments\"]++;continue;}\n  $policy=$policies[$a[\"level_id\"]]??null;if(!is_array($policy)){$stats[\"unresolvedPremiumAssignments\"]++;continue;}\n  $limit=null;$mode=(int)($policy[\"expire_option\"]??0);\n  if($mode===1){\n   $calendar=$policy[\"calendar\"]??\"\";$amount=(int)($policy[\"expire\"]??0);\n   if(!in_array($calendar,array(\"Days\",\"Weeks\",\"Months\",\"Years\"),true)||$amount<=0){$stats[\"unresolvedPremiumAssignments\"]++;continue;}\n   $registered=strtotime($u[\"user_registered\"].\" UTC\");\n   $date=explode(\"#\",$o[\"registration_date\"]??$u[\"user_registered\"])[0];$start=strtotime($date.\" UTC\");\n   if(!$start||!$registered){$stats[\"unresolvedPremiumAssignments\"]++;continue;}\n   $limit=strtotime(\"+\".$amount.\" \".$calendar,max($start,$registered));\n  }elseif($mode===2){$limit=strtotime(str_replace(\"/\",\"-\",$policy[\"expire_date\"]??\"\"));}\n  if($mode && !$limit){$stats[\"unresolvedPremiumAssignments\"]++;continue;}\n  if($limit && $limit<time()){$stats[\"inactivePremiumAssignments\"]++;continue;}\n  $cancel=$o[\"wlm_schedule_level_cancel\"]??null;\n  if($cancel){$cancel=is_numeric($cancel)?(int)$cancel:strtotime($cancel);if(!$cancel){$stats[\"unresolvedPremiumAssignments\"]++;continue;}if($cancel<=time()){$stats[\"inactivePremiumAssignments\"]++;continue;}$limit=$limit?min($limit,$cancel):$cancel;}\n  if($limit)$untils[]=$limit;else $lifetime=true;\n }\n $member=$lifetime||count($untils)>0;if($member)$stats[\"members\"]++;\n $out[\"identities\"][]=array(\"id\"=>\"wp-user-\".$u[\"ID\"],\"email\"=>$u[\"user_email\"],\"name\"=>$u[\"display_name\"],\"passwordHash\"=>$u[\"user_pass\"],\"role\"=>$member?\"member\":\"user\",\"memberUntil\"=>$member&&!$lifetime?gmdate(\"Y-m-d\\\\TH:i:s\\\\Z\",max($untils)):null);\n}\n$out[\"identityStats\"]=$stats;\necho json_encode($out,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE);"
ORIGIN = "https://www.breslovtorah.com"
PUBLIC_CLIPS = {
 "breslov-basics-01-the-first-step": "/audio/the-first-step.mp3",
 "breslov-basics-02-you-are-not-alone": "/audio/you-are-not-alone.mp3",
 "breslov-basics-03-every-good-thought-counts": "/audio/every-good-thought-counts.mp3",
 "bereishis-the-hidden-creation-of-water-clip": "/audio/bereishis-hidden-creation-of-water.mp3",
}
ALIASES = {("courses","azamra-good-point"):"azamra",("courses","simcha"):"simcha",
 ("series","likutey-moharan-2-tinyana"):"likutey-moharan-2"}
IMAGES = {"maimon":"/images/rabbi-nasan-maimon.jpg","rosenfeld":"/images/rabbi-rosenfeld.jpg",
 "dorfman":"/images/Rabbi-Michel-Dorfman.jpg"}
TEACHER_SLUGS={"maimon":"nasan-maimon","rosenfeld":"zvi-aryeh-rosenfeld","dorfman":"michel-dorfman"}
TEACHER_LINKS={"maimon":"/rabbi-maimon-media-library/","rosenfeld":"/rabbi-rosenfeld/",
 "dorfman":"/rabbi-yechiel-michel-dorfman-zal/"}
class PlainText(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.depth=0;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag in {"script","style","audio","video","iframe","object"}:self.depth+=1
  elif not self.depth:self.parts.append(" ")
 def handle_endtag(self,tag):
  if tag in {"script","style","audio","video","iframe","object"}:self.depth=max(0,self.depth-1)
  elif not self.depth:self.parts.append(" ")
 def handle_data(self,data):
  if not self.depth:self.parts.append(data)
def text(raw):
 raw=unescape(str(raw or ""))
 # Remove entire paired shortcode blocks before stripping any remaining tokens.
 raw=re.sub(r"\[([a-zA-Z_][\w:-]*)\b[^\]]*\].*?\[/\1\]"," ",raw,flags=re.S|re.I)
 raw=re.sub(r"\[[^\]]*\]"," ",raw)
 parser=PlainText();parser.feed(raw)
 value=" ".join(parser.parts)
 value=re.sub(r"(?:https?://|//|www\.)[^\s<>]+|/?(?:wp-content|media|uploads|files)/[^\s<>]+|\b[^\s<>]+\.(?:mp3|m4a|wav|ogg|mp4|webm|m3u8)\b[^\s<>]*"," ",value,flags=re.I)
 return " ".join(value.split())
def slug(raw):
 value=unquote(raw or "")
 if not value or any(not (c.isalnum() or c in "_-" or unicodedata.category(c).startswith("M")) for c in value):raise ValueError("Invalid source slug; review source IDs before publishing.")
 return value
def embed(raw):
 urls=[raw.strip()] if (raw or "").strip().startswith("http") else re.findall(r'(?:src=["\'])(https?://[^"\']+)',unescape(raw or ""))
 for url in urls:
  p=urlsplit(url)
  if p.username or p.password:continue
  if p.hostname in {"vimeo.com","www.vimeo.com"} and re.fullmatch(r"/\d+",p.path):return "https://player.vimeo.com/video"+p.path
  if p.hostname=="youtu.be" and re.fullmatch(r"/[A-Za-z0-9_-]+",p.path):return "https://www.youtube-nocookie.com/embed"+p.path
  if p.hostname=="player.vimeo.com" and re.fullmatch(r"/video/\d+",p.path):return "https://player.vimeo.com"+p.path
  if p.hostname in {"www.youtube.com","www.youtube-nocookie.com"} and re.fullmatch(r"/embed/[A-Za-z0-9_-]+",p.path):return "https://www.youtube-nocookie.com"+p.path
 return None
def export(wp_path,output):
 # WP bootstrap loads core only; no plugin/theme code, no shell interpolation.
 result=subprocess.run(["wp","eval",PHP_QUERY,"--path="+str(wp_path),"--allow-root","--skip-plugins","--skip-themes"],
                       check=True,capture_output=True,text=True)
 raw=json.loads(result.stdout)
 terms={}
 for t in raw["terms"]:
  t["term_id"]=int(t["term_id"]);t["parent"]=int(t["parent"]);t["slug"]=slug(t["slug"]);terms[t["term_id"]]=t
 termmeta=defaultdict(dict)
 for m in raw["termmeta"]:termmeta[int(m["term_id"])][m["meta_key"]]=m["meta_value"]
 relations=defaultdict(list)
 for r in raw["relations"]:
  if int(r["term_id"]) in terms:relations[int(r["object_id"])].append(terms[int(r["term_id"])])
 meta=defaultdict(dict)
 for m in raw["meta"]:meta[int(m["post_id"])][m["meta_key"]]=m["meta_value"]
 flags={(str(f["type"]),int(f["content_id"])) for f in raw["protection"] if f["level_id"]=="Protection"}
 protected_terms={i for k,i in flags if k=="~CATEGORY"}
 def protected(p,related):
  inherited=set()
  for term in related:
   current=term
   visited=set()
   while current and current["term_id"] not in visited:
    visited.add(current["term_id"]);inherited.add(current["term_id"]);current=terms.get(current["parent"])
  return bool(p["post_password"]) or (p["post_type"],int(p["ID"])) in flags or bool(inherited & protected_terms)
 def collection_slug(t):
  if t["taxonomy"]=="series" and t["slug"] in {"nach","nach-prophets-and-writings","rabbi-rosenfeld-nach-prophets-writings"}:return "nach"
  return ALIASES.get((t["taxonomy"],t["slug"]),t["taxonomy"]+"-"+t["slug"])
 collections=[];teachers=[];lessons=[];pages=[];media=[];seen=set();collisions=[];counts=Counter()
 for t in terms.values():
  if t["taxonomy"]=="authors":
   key=t["slug"];teachers.append({"slug":TEACHER_SLUGS.get(key,key),"name":text(t["name"]),
    "description":text(t["description"]),"image":IMAGES.get(key,"/images/logo.png"),
    "legacyUrl":ORIGIN+TEACHER_LINKS.get(key,"/authors/"+quote(key)+"/"),"sourceId":t["term_id"]})
  elif t["taxonomy"] in {"courses","series","parshios","types","parshas"}:
   hidden=protected({"ID":0,"post_type":"term","post_password":""},[t])
   desc="" if hidden else text(termmeta[t["term_id"]].get("taxonomy_description") or t["description"])
   collections.append({"slug":collection_slug(t),"title":text(t["name"]),"description":desc,
    "image":"/images/logo.png","legacyUrl":ORIGIN+"/"+t["taxonomy"]+"/"+quote(t["slug"])+"/",
    "taxonomy":t["taxonomy"],"parentId":t["parent"],"count":int(t["count"]),"sourceId":t["term_id"],
    "hebrewTranslation":text(termmeta[t["term_id"]].get("hebrew_translation",""))})
 for p in raw["posts"]:
  source_id=int(p["ID"]);kind=p["post_type"];original=slug(p["post_name"]);related=relations[source_id]
  locked=protected(p,related)
  # Shortcodes/private sections must never be rendered as arbitrary HTML.
  body="" if locked else text(p["post_content"])
  legacy=ORIGIN+"/"+("videos/" if kind=="videos" else "shiurim/" if kind=="shiurim" else "")+quote(original)+"/"
  if kind=="page":
   pages.append({"slug":original,"title":text(p["post_title"]),"bodyText":body,"legacyUrl":legacy,
                 "sourceId":source_id,"parentId":int(p["post_parent"]),"access":"legacy" if locked else "public"})
   continue
  route=original
  if route in seen:
   route=route+("-video" if kind=="videos" else "-audio")
   collisions.append({"sourceId":source_id,"originalSlug":original,"assignedSlug":route})
  if route in seen:route=route+"-"+str(source_id)
  seen.add(route)
  lesson_id="wp-"+kind+"-"+str(source_id)
  speaker_terms=[t for t in related if t["taxonomy"]=="authors"]
  group_terms=[t for t in related if t["taxonomy"] in {"courses","series","types"}]
  topics=[t for t in related if t["taxonomy"] in {"post_tag","parshios","parshas"}]
  speaker=", ".join(text(t["name"]) for t in speaker_terms) or "Speaker to be confirmed"
  image=IMAGES.get(speaker_terms[0]["slug"],"/images/logo.png") if speaker_terms else "/images/logo.png"
  enclosure=meta[source_id].get("_shiurim:enclosure") or meta[source_id].get("enclosure")
  iframe=embed(meta[source_id].get("video_url","")) if kind=="videos" and not locked else None
  public_original=False
  if isinstance(enclosure,dict) and not locked:
   candidate=urlsplit(enclosure.get("url",""));candidate_path=unquote(candidate.path).lstrip("/")
   public_original=candidate.hostname in {"breslovtorah.com","www.breslovtorah.com"} and candidate_path.startswith("media/") and ".." not in Path(candidate_path).parts
  access="public" if (kind=="videos" and iframe and not locked) or public_original or (original in PUBLIC_CLIPS and not locked) else "legacy"
  entry={"id":lesson_id,"slug":route,"title":text(p["post_title"]),"speaker":speaker,
   "collection":text(group_terms[0]["name"]) if group_terms else "Torah Library",
   "topic":text(topics[0]["name"]) if topics else "Torah","format":"Video" if kind=="videos" else "Audio",
   "description":body[:320] or ("Continue on the original site for this teaching." if locked else ""),
   "legacyUrl":legacy,"image":image,
   "categories":[{"id":t["term_id"],"slug":t["slug"],"title":text(t["name"]),"taxonomy":t["taxonomy"],"parentId":t["parent"]} for t in related],
   "collectionSlugs":[collection_slug(t) for t in related if t["taxonomy"] in {"courses","series","parshios","types","parshas"}],
   "publishedAt":p["post_date_gmt"].replace(" ","T")+"Z","bodyText":body,
   "dedication":"" if locked else text(meta[source_id].get("shiur_dedicationsponsor","")),
   "access":access,"hasMedia":bool(enclosure or meta[source_id].get("video_url"))}
  if iframe:entry["embedUrl"]=iframe
  if isinstance(enclosure,dict):
   duration=str(enclosure.get("duration",""))
   if re.fullmatch(r"\d+(?::\d{2}){1,2}",duration):entry["duration"]=duration
   u=urlsplit(enclosure.get("url",""))
   path=unquote(u.path).lstrip("/")
   if u.hostname in {"breslovtorah.com","www.breslovtorah.com"} and path.startswith("media/") and ".." not in Path(path).parts:
    media.append({"id":"media-"+lesson_id,"lessonId":lesson_id,"kind":"original","path":path,
                  "mime":enclosure.get("mime") or "audio/mpeg","access":access,"filename":Path(path).name})
   else:counts["unresolvedMediaLocations"]+=1
  lessons.append(entry);counts[kind]+=1;counts["access-"+access]+=1
  if locked:counts["bodyWithheld"]+=1
 ids=[c["slug"] for c in collections]
 if len(ids)!=len(set(ids)):raise ValueError("Collection aliases collided; resolve before publishing.")
 catalog={"lessons":lessons,"collections":collections,"teachers":teachers,"pages":pages}
 report={"generatedAt":datetime.now(timezone.utc).isoformat(),"counts":dict(counts),"pages":len(pages),
 "collections":len(collections),"teachers":len(teachers),"mediaRecords":len(media),"slugCollisions":collisions,
 "sourceInventory":raw["counts"],"identityMigration":raw["identityStats"],"limitations":["Legacy audio access retained; no member entitlements or users imported.",
 "Password/protected bodies withheld; explicit/category rules evaluated conservatively.",
 "Public original media policy resolved from default protection off, explicit/category/password checks, file protection off and representative guest player verification; referrer protection is not membership.",
 "Full video attribution and unsupported embeds require staff review.",
 "Sanitized text does not reproduce shortcode/accordion layout or inline timing interactions."]}
 # Check actual storage availability separately from source access metadata.
 original_root=wp_path.resolve()
 missing=[];unsafe=[];empty=[];total_bytes=0
 for record in media:
  file_path=original_root/record["path"]
  if original_root not in file_path.resolve().parents:
   unsafe.append(record["id"]);continue
  if not file_path.is_file():
   missing.append(record["id"]);continue
  size=file_path.stat().st_size
  if not size:empty.append(record["id"])
  total_bytes+=size
 report["mediaFileAudit"]={"records":len(media),"existing":len(media)-len(missing)-len(unsafe),
  "missingCount":len(missing),"unsafeCount":len(unsafe),"emptyCount":len(empty),
  "existingTotalBytes":total_bytes,"missingMediaIds":missing,"unsafeMediaIds":unsafe}
 # Serialize/validate everything before modifying only owned Next.js output files.
 serialized={"content/catalog.json":json.dumps(catalog,ensure_ascii=False,indent=2),
 "content/import-report.json":json.dumps(report,ensure_ascii=False,indent=2),
 "data/import-media.json":json.dumps(media,ensure_ascii=False,indent=2),
 "data/import-users.json":json.dumps(raw["identities"],ensure_ascii=False,indent=2)}
 for name,value in serialized.items():
  dest=output/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(value+"\n",encoding="utf-8")
  if name.startswith("data/"):dest.chmod(0o600)
 print(json.dumps({"counts":dict(counts),"pages":len(pages),"collections":len(collections),"teachers":len(teachers),"mediaRecords":len(media),"identityMigration":raw["identityStats"]}))
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument("--wordpress",type=Path,required=True)
 parser.add_argument("--output",type=Path,required=True)
 args=parser.parse_args()
 if args.output.resolve()==args.wordpress.resolve() or args.wordpress.resolve() in args.output.resolve().parents:
  parser.error("Output must be outside the WordPress installation.")
 export(args.wordpress,args.output)
if __name__=="__main__":main()
