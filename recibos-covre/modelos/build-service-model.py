"""Build service receipt templates with the existing receipt geometry and Arial faces.

Run before build-static-layout.py and build-bundle.cjs. Pass --font-dir on
machines where the Arial fonts are not installed in C:/Windows/Fonts.
"""
import argparse
import copy
import json
from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

parser = argparse.ArgumentParser()
parser.add_argument('--font-dir', type=Path, default=Path('C:/Windows/Fonts'))
args = parser.parse_args()
root = Path(__file__).parent
pdfmetrics.registerFont(TTFont('ReceiptArial', str(args.font_dir / 'arial.ttf')))
pdfmetrics.registerFont(TTFont('ReceiptArialBold', str(args.font_dir / 'arialbd.ttf')))

title = 'RECIBO DE PRESTAÇÃO DE SERVIÇO'
declaration = ('Declaro, para os devidos fins, que recebi da COVRE & CIA LTDA, '
               'inscrita no CNPJ nº 28.419.232/0001-06, o valor acima especificado, '
               'referente à prestação do serviço descrito neste recibo, dando plena '
               'quitação exclusivamente quanto ao valor e ao serviço nele discriminados.')
layout = json.loads((root / 'layout.json').read_text(encoding='utf-8'))
layout['servico'] = copy.deepcopy(layout['chapa'])
partners = json.loads((root / 'partners-layout.json').read_text(encoding='utf-8'))
partners['servico'] = copy.deepcopy(partners['chapa'])
partners['servico']['declarationText'] = declaration
static = json.loads((root / 'static-layout.json').read_text(encoding='utf-8'))

for variant in ['-v1', '-partners-v2', '-v1-payment', '-partners-v2-payment']:
    fields = copy.deepcopy(static['chapa' + variant + '.pdf'])
    heading = fields['titulo']
    heading['text'] = title
    heading['x'] = (layout['servico']['width'] - pdfmetrics.stringWidth(title, 'ReceiptArialBold', heading['size'])) / 2
    # The partner variants leave this area blank for the actual payer declaration.
    if 'declaracao0' in fields:
        metric = fields['declaracao0']
        fields = {key: value for key, value in fields.items() if not key.startswith('declaracao')}
        lines, line = [], ''
        for word in declaration.split():
            candidate = (line + ' ' + word).strip()
            if line and pdfmetrics.stringWidth(candidate, 'ReceiptArial', metric['size']) > 480:
                lines.append(line)
                line = word
            else:
                line = candidate
        lines.append(line)
        assert len(lines) <= 3, 'Declaration must fit above the issue date'
        for index, text in enumerate(lines):
            fields['declaracao' + str(index)] = {**metric, 'text': text, 'y': metric['y'] - index * 12.42}
    output = root / ('servico' + variant + '.pdf')
    document = canvas.Canvas(str(output), pagesize=(layout['servico']['width'], layout['servico']['height']), invariant=1)
    document.setTitle(title)
    document.setAuthor('GaveBlue')
    for field in fields.values():
        if field.get('kind') == 'line':
            color = field['color']
            if isinstance(color, (list, tuple)):
                document.setFillColorRGB(*color)
            else:
                document.setFillGray(color)
            document.rect(field['x'], field['y'], field['width'], field['size'], stroke=0, fill=1)
        else:
            document.setFillGray(0)
            document.setFont('ReceiptArialBold' if field['weight'] == 'bold' else 'ReceiptArial', field['size'])
            document.drawString(field['x'], field['y'], field['text'])
    document.showPage()
    document.save()
    print('Built', output.name)

for name, data in [('layout.json', layout), ('partners-layout.json', partners)]:
    (root / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
