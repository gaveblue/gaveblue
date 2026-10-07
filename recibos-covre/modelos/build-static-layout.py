"""Extract exact text bounds from the existing PDF templates for the visual editor."""
import json
import sys
from pathlib import Path
import pdfplumber

root = Path(__file__).parent
result = json.loads((root/'static-layout.json').read_text(encoding='utf-8')) if len(sys.argv) > 1 else {}
paths = [root/name for name in sys.argv[1:]] if len(sys.argv) > 1 else root.glob('*.pdf')
for path in paths:
    with pdfplumber.open(path) as document:
        page = document.pages[0]
        fields = {}
        declaration = 0
        for line in page.extract_text_lines():
            text = line['text']
            if text.startswith('RECIBO'): key = 'titulo'
            elif text.startswith('PAGADOR'): key = 'tituloPagador'
            elif text.startswith('COVRE'): key = 'identidadePagador'
            elif text.startswith('Endere'): key = 'enderecoPagador'
            elif text.startswith('PRESTADOR'): key = 'tituloRecebedor'
            elif text.startswith('IDENTIFICA'): key = 'tituloServico'
            elif text.startswith('DADOS'): key = 'tituloPagamento'
            elif text.startswith('_'): key = 'linhaAssinatura'
            elif text.startswith('ANEXO'): key = 'tituloAnexo'
            else:
                key = 'declaracao' + str(declaration)
                declaration += 1
            char = line['chars'][0]
            fields[key] = {
                'text': text, 'x': line['x0'], 'y': char['matrix'][5],
                'size': char['size'], 'weight': 'bold' if 'Bold' in char['fontname'] else 'normal',
                'bounds': {'x': line['x0'], 'y': page.height-line['bottom'],
                           'width': line['x1']-line['x0'], 'height': line['bottom']-line['top']}
            }
        result[path.name] = fields
        separators = sorted((r for r in page.rects if r['width'] > 400 and 1 < r['height'] < 6), key=lambda r: -r['y0'])
        for key, rect in zip(['linhaPagador', 'linhaRecebedor', 'linhaServico', 'linhaPagamento', 'linhaAnexo'], separators):
            fields[key] = {
                'kind': 'line', 'text': 'Linha divisória',
                'x': rect['x0'], 'y': rect['y0'], 'size': rect['height'],
                'width': rect['width'], 'color': rect['non_stroking_color'],
                'bounds': {'x': rect['x0'], 'y': rect['y0'], 'width': rect['width'], 'height': rect['height']}
            }
(root/'static-layout.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print('Extracted text bounds for', len(result), 'templates')
