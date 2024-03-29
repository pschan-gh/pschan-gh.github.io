<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns:xsl = "http://www.w3.org/1999/XSL/Transform"
	xmlns:xh = "http://www.w3.org/1999/xhtml"
	xmlns:lv = "http://www.math.cuhk.edu.hk/~pschan/cranach"
	xmlns:idx = "http://www.math.cuhk.edu.hk/~pschan/elephas_index"
	xmlns:m = "http://www.w3.org/1998/Math/MathML"
	xmlns="http://www.math.cuhk.edu.hk/~pschan/elephas_index"
	>

	<xsl:output method="xml" indent="yes"/>

	<xsl:variable name="idx" select="'http://www.math.cuhk.edu.hk/~pschan/elephas_index'"/>
	<xsl:variable name="lv" select="'http://www.math.cuhk.edu.hk/~pschan/cranach'"/>
	<xsl:variable name="xh" select="'http://www.w3.org/1999/xhtml'"/>

	<xsl:variable name="lowercase" select="'abcdefghijklmnopqrstuvwxyz'" />
	<xsl:variable name="uppercase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />

	<xsl:param name="cranachfilename" select="''"/>
	<xsl:param name="cranachfp" select="''" />
	<xsl:param name="cranachmd5" select="''"/>

	<xsl:variable name="cranachdoc" select="document($cranachfp)"/>

	<xsl:template match="/">
		<document>
			<index>
				<xsl:copy-of select="//idx:branch[@filename != $cranachfilename]|//idx:ref[(@filename != $cranachfilename) and (@filename != 'self')]|//idx:section[@filename != $cranachfilename]" />
				<xsl:apply-templates select="//lv:keyword[not(@slide = 'all')]" />
				<xsl:apply-templates select="//lv:statement|//lv:substatement|//lv:figure|//lv:*[(lv:label) and (@type='Section')]" />
				<xsl:apply-templates select="//idx:index/lv:ref" />
				<xsl:if test="not($cranachfp = '')" >
					<xsl:apply-templates select="$cranachdoc//lv:keyword[not(@slide ='all')]" />
					<xsl:apply-templates select="$cranachdoc//lv:statement|$cranachdoc//lv:substatement|$cranachdoc//lv:figure|$cranachdoc//lv:ref|$cranachdoc//lv:*[(lv:label) and (@type='Section')]" />
				</xsl:if>
			</index>
		</document>
	</xsl:template>

	<xsl:template match="lv:keyword[not(@slide = 'all')]">
		<xsl:element name="keyword" namespace="{$lv}">
			<xsl:copy-of select="@*" />
			<xsl:attribute name="filename">
				<xsl:value-of select="$cranachfilename"/>
			</xsl:attribute>
			<xsl:attribute name="file_md5">
				<xsl:value-of select="$cranachmd5"/>
			</xsl:attribute>
			<xsl:attribute name="keyword">
				<xsl:value-of select="translate(translate(
					./text(),
					translate(
					./text(),
					'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
					''
					),
					''
					), $uppercase, $lowercase)
					" />
				</xsl:attribute>
				<xsl:copy-of select="text()" />
			</xsl:element>
		</xsl:template>

		<xsl:template match="lv:statement|lv:substatement|lv:figure|lv:ref|lv:*[(lv:label) and (@type='Section')]">
			<xsl:element name="{local-name()}" namespace="{$idx}">
				<xsl:copy-of select="@*"/>
				<xsl:attribute name="filename">
					<xsl:value-of select="$cranachfilename"/>
				</xsl:attribute>
				<xsl:attribute name="file_md5">
					<xsl:value-of select="$cranachmd5"/>
				</xsl:attribute>
				<xsl:apply-templates select="idx:label|lv:label"/>
				<xsl:apply-templates select="idx:title|lv:title"/>
			</xsl:element>
		</xsl:template>

		<xsl:template match="idx:label|lv:label">
			<xsl:element name="label" namespace="http://www.math.cuhk.edu.hk/~pschan/elephas_index">
				<xsl:copy-of select="../@*"/>
				<xsl:copy-of select="@*"/>
			</xsl:element>
		</xsl:template>

		<xsl:template match="idx:title|lv:title">
			<xsl:element name="title" namespace="http://www.math.cuhk.edu.hk/~pschan/elephas_index">
				<xsl:copy-of select="@*"/>
				<xsl:apply-templates select="*|text()"/>
			</xsl:element>
		</xsl:template>
	</xsl:stylesheet>
