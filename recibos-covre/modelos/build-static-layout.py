"""Extract exact text bounds from the existing PDF templates for the visual editor."""
import json
from pathlib import Path
import pdfplumber

root = Path(__file__).parent
result = {}
for path in root.glob('*.pdf'):
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
(root/'static-layout.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print('Extracted text bounds for', len(result), 'templates')
