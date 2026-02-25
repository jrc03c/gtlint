# GuidedTrack Built-in Methods and Functions

## Data Types

Runtime types accessible via `.type`:
- `"string"` -- text
- `"number"` -- numeric values
- `"collection"` -- arrays
- `"association"` -- objects/dictionaries
- `"datetime"` -- date and time values
- `"duration"` -- time durations (e.g., `5.seconds`, `2.minutes`)

## String Methods

```
>> len = text.size
>> upper = text.uppercase
>> lower = text.lowercase
>> cleaned = text.clean          -- trims whitespace
>> parts = text.split(",")
>> pos = text.find("needle")
>> n = text.count("a")
>> encoded = text.encode("URL")
>> decoded = text.decode("JSON")
```

## Number Methods

```
>> rounded = num.round
>> rounded2 = num.round(2)
>> dur = 5.seconds     -- also: .minutes, .hours, .days, .weeks, .months, .years
```

## Collection Methods

Collections are **1-indexed** (`items[1]` is the first element).

```
>> items.add("new")
>> items.insert("new", 2)       -- insert at position 2
>> items.remove(1)               -- remove by position
>> items.erase("value")          -- remove by value
>> combined = a.combine(b)
>> items.shuffle
>> sorted = items.sort("asc")   -- or "desc"
>> unique = items.unique
>> len = items.size
>> max_val = items.max
>> min_val = items.min
>> avg = items.mean
>> med = items.median
>> count = items.count("value")
>> pos = items.find("value")
```

## Association Methods

```
>> all_keys = obj.keys
>> obj.erase("value")
>> obj.remove("key")
>> json = obj.encode("JSON")
```

## Universal Methods

Available on any variable:

```
>> t = variable.type   -- returns "string", "number", "collection", "association", "datetime", "duration"
>> s = variable.text   -- string representation
```

## Namespaced Functions

```
>> today = calendar::date
>> now = calendar::now
```

## Member Access

### Property access

```
>> item_type = variable.type
>> first_char = text[1]
```

### Association access

```
>> person = {"name" -> "Alice", "age" -> 30}
>> name = person["name"]
```

### Collection indexing (1-indexed)

```
>> numbers = [10, 20, 30]
>> first = numbers[1]   -- Gets 10
>> last = numbers[3]    -- Gets 30
```
