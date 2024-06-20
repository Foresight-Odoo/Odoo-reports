from odoo import models, fields, api, _

class PosOrder(models.Model):
    _inherit = 'pos.order'

    config_id = fields.Many2one('pos.config', related='session_id.config_id', string="Point of Sale", readonly=False, store=True)
    is_product = fields.Boolean(
        string="Product", compute="compute_is_product", search='_search_is_product')
    is_consu = fields.Boolean(
        string="Consumable", compute="compute_is_consu", search='_search_is_consu')
    is_service = fields.Boolean(
        string="Service", compute="compute_is_service", search='_search_is_service')
    
    def compute_is_consu(self):
        if any(line.product_id.detailed_type in ['consu'] for line in self.lines):
            self.is_consu = True
        else:
            self.is_consu = False
    def compute_is_service(self):
        if any(line.product_id.detailed_type in ['service'] for line in self.lines):
            self.is_service = True
        else:
            self.is_service = False
    def compute_is_product(self):
        if any(line.product_id.detailed_type in ['product'] for line in self.lines):
            self.is_product = True
        else:
            self.is_product = False

    def _search_is_product(self, operator, value):
        results = []

        if value:
            pos_order_line_ids = self.env['pos.order.line'].search([('product_id.detailed_type', '=', 'product')])
            if pos_order_line_ids:
                for pos_orderLine_id in pos_order_line_ids:
                    # if any(item in self.env.user.groups_id.ids for item in expense_sheet_id.group_ids.ids):
                    results.append(pos_orderLine_id.order_id.id)
        return [('id', 'in', list(set(results)))]
    def _search_is_consu(self, operator, value):
        results = []

        if value:
            pos_order_line_ids = self.env['pos.order.line'].search([('product_id.detailed_type', '=', 'consu')])
            if pos_order_line_ids:
                for pos_orderLine_id in pos_order_line_ids:
                    # if any(item in self.env.user.groups_id.ids for item in expense_sheet_id.group_ids.ids):
                    results.append(pos_orderLine_id.order_id.id)
        return [('id', 'in', list(set(results)))]
    def _search_is_service(self, operator, value):
        results = []

        if value:
            pos_order_line_ids = self.env['pos.order.line'].search([('product_id.detailed_type', '=', 'service')])
            if pos_order_line_ids:
                for pos_orderLine_id in pos_order_line_ids:
                    # if any(item in self.env.user.groups_id.ids for item in expense_sheet_id.group_ids.ids):
                    results.append(pos_orderLine_id.order_id.id)
        return [('id', 'in', list(set(results)))]