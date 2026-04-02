export type Division = {

    code: string
    name: string

}

export type DivisionCategory = {

    category_name: string
    divisions: Division[]

}

export type DivisionsResponse = {

    year: number
    categories: DivisionCategory[]

}




