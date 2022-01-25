select 
    todo.id, 
    todo.description, 
    developer.email, 
    datediff(now(), todo.start_date) as days_due
from 
    todo
inner join developer on developer.developer = todo.developer
where
    datediff(now(), todo.start_date) >= 14