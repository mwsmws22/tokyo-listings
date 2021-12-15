select * 
from properties p 
left outer join listings l
	on p.id = l.property_id
where l.availability = '募集中' 
	and l.url like '%aeras-group%'
	and p.interest = 'Extremely'