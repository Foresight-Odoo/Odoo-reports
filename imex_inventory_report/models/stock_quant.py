from odoo import models, fields, api

class StockQuant(models.Model):
    _inherit = 'stock.quant'

    barcode = fields.Char(related="product_id.barcode", string="Barcode", store=True)
    value = fields.Monetary('Value', compute='_compute_value', groups='stock.group_stock_manager', store=True)