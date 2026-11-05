"""Validate supplied handoff data. Run: python3 validate_content.py"""
import json
from pathlib import Path
from collections import Counter

root=Path(__file__).resolve().parent
data=json.loads((root/'lesson-content.json').read_text())
assets=json.loads((root/'asset-manifest.json').read_text())['assets']
asset_ids={a['id'] for a in assets}
lessons=[l for u in data['units'] for l in u['lessons']]
questions=[q for l in lessons for q in l['questions']]
assert len(data['units'])==7
assert len(lessons)==33 and len(questions)==195
assert len({q['id'] for q in questions})==195
assert len({l['id'] for l in lessons})==33
assert sum(len(l['introductions']) for l in lessons)==65
counts=Counter(q['type'] for q in questions)
assert counts==dict(multiple_choice=98,word_bank=62,match_pairs=24,ordering=11),counts
for u in data['units']:
    assert any(q['type']=='ordering' for l in u['lessons'] for q in l['questions']),u['id']
    for l in u['lessons']:
        assert l['question_count']==len(l['questions'])
        assert len(l['questions'])==(3 if l['source_id']=='1.1' else 6)
        intro_ids={i['id'] for i in l['introductions']}
        q_ids={q['id'] for q in l['questions']}
        seen_intros=set();seen_questions=set()
        for step in l['steps']:
            if step['kind']=='introduction':
                assert step['ref'] in intro_ids
                seen_intros.add(step['ref'])
            elif step['kind']=='question':
                assert step['ref'] in q_ids and step['ref'] not in seen_questions
                q=next(q for q in l['questions'] if q['id']==step['ref'])
                assert all(i['id'] in seen_intros for i in l['introductions'] if i['before_question']<=q['number'])
                seen_questions.add(step['ref'])
            else:assert step['kind']=='recap' and step['ref']==l['id']
        assert seen_intros==intro_ids and seen_questions==q_ids
        assert set(l['suggested_intro_assets'])<=asset_ids
        for q in l['questions']:
            assert q['feedback'] and q['prompt']
            if q['type']=='multiple_choice':
                ids=[o['id'] for o in q['options']]
                assert len(ids)==len(set(ids))
                assert q['correct_option_id'] in ids
            elif q['type']=='word_bank':
                ids=[t['id'] for t in q['tiles']]
                correct=[b['correct_tile_id'] for b in q['blanks']]
                assert len(ids)==len(set(ids)) and len(correct)==len(set(correct))
                assert set(correct)<=set(ids)
                assert q['prompt'].count('___')==len(q['blanks'])
                assert q['blank_order'] in ['fixed','interchangeable']
            elif q['type']=='match_pairs':
                ids=[p['id'] for p in q['pairs']]
                assert len(ids)==len(set(ids))
                assert len({p['right']['text'] for p in q['pairs']})==len(ids)
                assert Counter(p for r in q['rounds'] for p in r)==Counter(ids)
                assert all(2<=len(r)<=3 for r in q['rounds'])
                for p in q['pairs']:
                    if 'asset_id' in p['left']:assert p['left']['asset_id'] in asset_ids
            elif q['type']=='ordering':
                ids=[i['id'] for i in q['items']]
                assert len(ids)>=2 and len(ids)==len(set(ids))
                assert set(ids)==set(q['correct_order']) and len(ids)==len(q['correct_order'])
            else:raise AssertionError(q['type'])
print('PASS: 7 units; 33 lessons; 65 introductions; 195 questions; 11 ordering activities; valid answer IDs, slots, rounds, steps, and asset references.')
