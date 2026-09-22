-- The English FAQ rows were written by a non-native speaker and never edited:
-- a question with no question mark ("How to proceed an order"), missing
-- articles and plurals, a stray leading space and trailing newline, a sentence
-- starting with "or" after a full stop, and an ordering answer that ran out
-- mid-phrase at "Fourthly We arrange the production". The six other languages
-- were translated cleanly and are left untouched; their four-step ordering
-- answer is what the English is brought up to, so no step is invented here.
-- Every statement is anchored on the broken text, so re-running does nothing.

update faq_translations set question = 'Do you offer a warranty on the products?'
 where locale = 'en' and question = 'Do you offer guarantee for the products?';

update faq_translations set question = 'How do I place an order?'
 where locale = 'en' and question = 'How to proceed an order';

update faq_translations set question = 'Do you accept sample orders?'
 where locale = 'en' and question = 'Do you accept sample order?';

update faq_translations set answer = 'First, tell us your requirements or the intended use. We then quote against those requirements, or against our own recommendations. Next, you confirm the samples and pay a deposit to formalize the order. Finally, we arrange production.'
 where locale = 'en' and answer like '%Fourthly We arrange the production%';

update faq_translations set answer = 'Generally 5–10 days if the goods are in stock, or 15–20 days if they are not, depending on the quantity.'
 where locale = 'en' and answer like '%it is according to quantity.%';

update faq_translations set answer = 'Yes, our customers can order samples to check quality and function.'
 where locale = 'en' and answer like '%we support our customers to order sample%';

update faq_translations set answer = 'Yes. Please tell us before production begins, and confirm the design against our sample first.'
 where locale = 'en' and answer like '%please inform us formally before our production%';
